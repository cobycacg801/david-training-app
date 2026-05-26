"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { canAccess, planLabel, PLAN_PRICE, PLAN_PERKS, PLAN_COLOR } from "@/lib/planUtils";
import type { ChatMessage } from "./page";

// ── Helpers ───────────────────────────────────────────────────
const AVATAR_COLORS = ["#00f2ff", "#8b5cf6", "#f59e0b", "#3ecf8e", "#ef4444", "#ec4899"];
const avatarColor = (uid: string) =>
  AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

const formatTime = (ts: string) => {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

// ── Upgrade Gate (Base plan) ──────────────────────────────────
function UpgradeGate({ userPlan }: { userPlan: string }) {
  const color = PLAN_COLOR["pro"];
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 20,
      minHeight: "60vh", textAlign: "center", padding: "40px 24px",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(0,242,255,0.08)",
        border: "0.5px solid rgba(0,242,255,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36,
      }}>💬</div>

      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
          Group Chat is a Pro Feature
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", maxWidth: 380, lineHeight: 1.6, margin: "0 auto 6px" }}>
          Join the Pro community — connect with other members, share progress, and get motivation from Coach David.
        </p>
        <p style={{ fontSize: 26, fontWeight: 900, color, marginTop: 16, marginBottom: 20 }}>
          {PLAN_PRICE["pro"]}
        </p>
      </div>

      <div style={{ textAlign: "left", marginBottom: 8 }}>
        {(PLAN_PERKS["pro"] ?? []).map((perk, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#d4d4d8" }}>{perk}</span>
          </div>
        ))}
      </div>

      <a
        href="/#pricing"
        style={{
          padding: "14px 40px", borderRadius: 12,
          background: "linear-gradient(135deg,rgba(0,242,255,0.1),rgba(0,242,255,0.22))",
          border: "0.5px solid rgba(0,242,255,0.4)",
          fontSize: 14, fontWeight: 800, color,
          textDecoration: "none",
        }}
      >
        Upgrade to Pro →
      </a>

      <p style={{ fontSize: 11, color: "#3f3f46" }}>
        You&apos;re on the {planLabel(userPlan)} plan
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function GroupChat({
  initialMessages,
  userId,
  userName,
  userPlan,
}: {
  initialMessages: ChatMessage[];
  userId: string;
  userName: string;
  userPlan: string;
}) {
  const hasAccess = canAccess(userPlan, "pro");

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  // Keep a ref to profile names so the realtime closure can access latest values
  const profilesRef = useRef<Record<string, string>>({});
  // Track IDs of messages we sent ourselves so realtime doesn't duplicate them
  const sentIdsRef = useRef<Set<string>>(new Set());

  // Build initial profiles map
  useEffect(() => {
    const map: Record<string, string> = { [userId]: userName };
    for (const m of initialMessages) {
      if (m.profiles?.full_name) map[m.user_id] = m.profiles.full_name;
    }
    profilesRef.current = map;
  }, []);

  // Scroll to bottom on load (instant) and on new messages (smooth)
  const isFirstRender = useRef(true);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isFirstRender.current ? "instant" : "smooth",
    } as ScrollIntoViewOptions);
    isFirstRender.current = false;
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!hasAccess) return;

    const supabase = createClient();

    const channel = supabase
      .channel("group-chat-room")
      .on(
        // @ts-expect-error — Supabase generic typing
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages" },
        async (payload: { new: ChatMessage }) => {
          const incoming = payload.new;

          // Skip messages this tab sent itself (already shown optimistically)
          // sentIdsRef tracks real DB IDs we received back from our own inserts
          if (sentIdsRef.current.has(incoming.id)) {
            sentIdsRef.current.delete(incoming.id);
            return;
          }

          // Resolve the sender's display name
          let senderName = profilesRef.current[incoming.user_id];
          if (!senderName) {
            const { data } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", incoming.user_id)
              .single();
            senderName = data?.full_name ?? "Member";
            profilesRef.current[incoming.user_id] = senderName;
          }

          setMessages(prev => [
            ...prev,
            { ...incoming, profiles: { full_name: senderName } },
          ]);
        }
      )
      .subscribe(status => setConnected(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [hasAccess, userId]);

  // Send message
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setError(null);
    setSending(true);
    setInput("");

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      user_id: userId,
      content: trimmed,
      created_at: new Date().toISOString(),
      profiles: { full_name: userName },
    };
    setMessages(prev => [...prev, optimistic]);

    const supabase = createClient();
    const { data, error: dbErr } = await supabase
      .from("group_messages")
      .insert({ user_id: userId, content: trimmed })
      .select()
      .single();

    if (dbErr) {
      // Revert optimistic
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(trimmed);
      setError("Failed to send message. Try again.");
    } else if (data) {
      // Register the real ID so the realtime handler skips it (no duplicate)
      sentIdsRef.current.add(data.id);
      // Swap temp for real row
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId
            ? { ...data, profiles: { full_name: userName } }
            : m
        )
      );
    }

    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!hasAccess) return <UpgradeGate userPlan={userPlan} />;

  const myColor = avatarColor(userId);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 190px)", minHeight: 480,
    }}>

      {/* ── CHAT HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        background: "rgba(255,255,255,0.02)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "16px 16px 0 0",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(0,242,255,0.08)",
            border: "0.5px solid rgba(0,242,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>💬</div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 1 }}>
              Group Chat
            </h1>
            <p style={{ fontSize: 11, color: "#52525b" }}>
              Coach David · All Pro &amp; Elite members
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: connected ? "#3ecf8e" : "#52525b",
            boxShadow: connected ? "0 0 8px #3ecf8e" : "none",
            transition: "all 0.4s",
          }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: connected ? "#3ecf8e" : "#52525b", letterSpacing: 0.5 }}>
            {connected ? "LIVE" : "CONNECTING…"}
          </span>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
        background: "rgba(255,255,255,0.01)",
        border: "0.5px solid rgba(255,255,255,0.05)",
        borderTop: "none", borderBottom: "none",
        display: "flex", flexDirection: "column",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.08) transparent",
      }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 10, opacity: 0.4,
          }}>
            <span style={{ fontSize: 32 }}>💬</span>
            <p style={{ fontSize: 13, color: "#a1a1aa" }}>
              Be the first to say something!
            </p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => {
          const isMe    = msg.user_id === userId;
          const name    = msg.profiles?.full_name ?? "Member";
          const color   = avatarColor(msg.user_id);
          const initial = name[0]?.toUpperCase() ?? "?";

          // Group consecutive messages from the same user
          const prevMsg = messages[i - 1];
          const sameSenderAsPrev = prevMsg && prevMsg.user_id === msg.user_id;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: isMe ? "row-reverse" : "row",
                gap: 8,
                marginBottom: 4,
                marginTop: sameSenderAsPrev ? 2 : 14,
                alignItems: "flex-end",
              }}
            >
              {/* Avatar (others only, hide if consecutive) */}
              {!isMe && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: `${color}18`,
                  border: `0.5px solid ${color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color,
                  opacity: sameSenderAsPrev ? 0 : 1,
                }}>
                  {initial}
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: "68%",
                display: "flex", flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
              }}>
                {/* Sender name — only for first in group */}
                {!isMe && !sameSenderAsPrev && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color,
                    marginBottom: 3, paddingLeft: 2, letterSpacing: 0.3,
                  }}>
                    {name}
                  </span>
                )}

                <div style={{
                  background: isMe
                    ? "rgba(0,242,255,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${isMe ? "rgba(0,242,255,0.2)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: isMe
                    ? "14px 4px 14px 14px"
                    : "4px 14px 14px 14px",
                  padding: "9px 13px",
                  // Temp messages are slightly dimmed
                  opacity: msg.id.startsWith("temp-") ? 0.7 : 1,
                }}>
                  <p style={{
                    fontSize: 13, color: isMe ? "#e4f8ff" : "#e4e4e7",
                    lineHeight: 1.55, margin: 0,
                    wordBreak: "break-word", whiteSpace: "pre-wrap",
                  }}>
                    {msg.content}
                  </p>
                </div>

                <span style={{
                  fontSize: 9, color: "#3f3f46",
                  marginTop: 3,
                  paddingLeft: isMe ? 0 : 2,
                  paddingRight: isMe ? 2 : 0,
                }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT AREA ── */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(255,255,255,0.02)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "0 0 16px 16px",
        borderTop: "0.5px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "0.5px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "6px 12px",
            fontSize: 11, color: "#f87171", marginBottom: 10,
          }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          {/* My avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: `${myColor}18`,
            border: `0.5px solid ${myColor}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: myColor,
            marginBottom: 2,
          }}>
            {userName[0]?.toUpperCase() ?? "?"}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message the group… (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{
              flex: 1, resize: "none", overflow: "hidden",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: "#e4e4e7",
              outline: "none", fontFamily: "inherit",
              lineHeight: 1.5, minHeight: 42,
              transition: "border-color 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(0,242,255,0.3)"; }}
            onBlur={e =>  { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              border: "0.5px solid",
              cursor: input.trim() && !sending ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              background: input.trim() && !sending
                ? "rgba(0,242,255,0.1)"
                : "rgba(255,255,255,0.02)",
              borderColor: input.trim() && !sending
                ? "rgba(0,242,255,0.35)"
                : "rgba(255,255,255,0.06)",
            }}
          >
            {sending ? (
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "1.5px solid rgba(0,242,255,0.2)",
                borderTopColor: "#00f2ff",
                animation: "spin 0.6s linear infinite",
              }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14.5 1.5L7 9M14.5 1.5L10 14.5L7 9M14.5 1.5L1.5 5.5L7 9"
                  stroke={input.trim() ? "#00f2ff" : "#52525b"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        <p style={{ fontSize: 10, color: "#3f3f46", marginTop: 8, textAlign: "center" }}>
          Be respectful · Coach David reads every message
        </p>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
