"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { canAccess, PLAN_PRICE, PLAN_PERKS } from "@/lib/planUtils";

const G = "#c9a84c";

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

export type PrivateMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

// ── Upgrade Gate ──────────────────────────────────────────────
function UpgradeGate() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 20,
      minHeight: "60vh", textAlign: "center", padding: "40px 24px",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(201,168,76,0.08)",
        border: "0.5px solid rgba(201,168,76,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
      }}>👑</div>

      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
          Private Chat is an Elite Feature
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", maxWidth: 380, lineHeight: 1.6, margin: "0 auto 6px" }}>
          Get direct 1:1 access to Coach David — ask questions, share updates,
          and get personalized coaching anytime.
        </p>
        <p style={{ fontSize: 26, fontWeight: 900, color: G, marginTop: 16, marginBottom: 20 }}>
          {PLAN_PRICE["elite"]}
        </p>
      </div>

      <div style={{ textAlign: "left", marginBottom: 8 }}>
        {(PLAN_PERKS["elite"] ?? []).map((perk, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: G, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#d4d4d8" }}>{perk}</span>
          </div>
        ))}
      </div>

      <a href="/#pricing" style={{
        padding: "14px 40px", borderRadius: 12,
        background: "linear-gradient(135deg,rgba(201,168,76,0.12),rgba(201,168,76,0.24))",
        border: "0.5px solid rgba(201,168,76,0.4)",
        fontSize: 14, fontWeight: 800, color: G, textDecoration: "none",
      }}>
        Upgrade to Elite →
      </a>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function PrivateChat({
  initialMessages,
  userId,
  userName,
  userPlan,
  davidId,
  davidName,
}: {
  initialMessages: PrivateMessage[];
  userId: string;
  userName: string;
  userPlan: string;
  davidId: string;
  davidName: string;
}) {
  const hasAccess = canAccess(userPlan, "elite");

  const [messages, setMessages] = useState<PrivateMessage[]>(initialMessages);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const sentIdsRef     = useRef<Set<string>>(new Set());
  const isFirstRender  = useRef(true);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isFirstRender.current ? "instant" : "smooth",
    } as ScrollIntoViewOptions);
    isFirstRender.current = false;
  }, [messages]);

  // Mark incoming messages as read
  useEffect(() => {
    if (!hasAccess) return;
    createClient()
      .from("private_messages")
      .update({ read: true })
      .eq("receiver_id", userId)
      .eq("read", false)
      .then(() => {});
  }, [hasAccess, userId]);

  // Realtime
  useEffect(() => {
    if (!hasAccess) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`private-chat-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages" },
        (payload: { new: PrivateMessage }) => {
          const msg = payload.new;
          const isMyMsg    = msg.sender_id === userId   && msg.receiver_id === davidId;
          const isDavidMsg = msg.sender_id === davidId  && msg.receiver_id === userId;
          if (!isMyMsg && !isDavidMsg) return;

          if (sentIdsRef.current.has(msg.id)) {
            sentIdsRef.current.delete(msg.id);
            return;
          }
          setMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hasAccess, userId, davidId]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setError(null);
    setSending(true);
    setInput("");

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, sender_id: userId, receiver_id: davidId,
      content: trimmed, read: false, created_at: new Date().toISOString(),
    }]);

    const { data, error: dbErr } = await createClient()
      .from("private_messages")
      .insert({ sender_id: userId, receiver_id: davidId, content: trimmed })
      .select()
      .single();

    if (dbErr) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(trimmed);
      setError("Failed to send. Try again.");
    } else if (data) {
      sentIdsRef.current.add(data.id);
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!hasAccess) return <UpgradeGate />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 190px)", minHeight: 480 }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        background: "rgba(201,168,76,0.03)",
        border: "0.5px solid rgba(201,168,76,0.12)",
        borderRadius: "16px 16px 0 0", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.06))",
            border: "0.5px solid rgba(201,168,76,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: G,
          }}>D</div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 1 }}>
              {davidName}
            </h1>
            <p style={{ fontSize: 11, color: "#52525b" }}>Your private coach · Elite members only</p>
          </div>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 800, color: G, letterSpacing: 1,
          background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)",
          padding: "3px 8px", borderRadius: 6, textTransform: "uppercase",
        }}>Elite</span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
        background: "rgba(255,255,255,0.01)",
        border: "0.5px solid rgba(255,255,255,0.05)",
        borderTop: "none", borderBottom: "none",
        display: "flex", flexDirection: "column",
        scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent",
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, opacity: 0.5, paddingBottom: 40,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>👋</div>
            <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
              This is your private line to Coach David. Say hello — he reads every message.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe     = msg.sender_id === userId;
          const sameSender = messages[i - 1]?.sender_id === msg.sender_id;

          return (
            <div key={msg.id} style={{
              display: "flex",
              flexDirection: isMe ? "row-reverse" : "row",
              gap: 8, marginBottom: 4,
              marginTop: sameSender ? 2 : 14,
              alignItems: "flex-end",
            }}>
              {!isMe && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.06))",
                  border: "0.5px solid rgba(201,168,76,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 900, color: G,
                  opacity: sameSender ? 0 : 1,
                }}>D</div>
              )}

              <div style={{
                maxWidth: "68%", display: "flex", flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
              }}>
                {!isMe && !sameSender && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: G, marginBottom: 3, paddingLeft: 2 }}>
                    Coach David
                  </span>
                )}
                <div style={{
                  background: isMe ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${isMe ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: isMe ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                  padding: "9px 13px",
                  opacity: msg.id.startsWith("temp-") ? 0.7 : 1,
                }}>
                  <p style={{
                    fontSize: 13, color: isMe ? "#f5e9c9" : "#e4e4e7",
                    lineHeight: 1.55, margin: 0,
                    wordBreak: "break-word", whiteSpace: "pre-wrap",
                  }}>{msg.content}</p>
                </div>
                <span style={{
                  fontSize: 9, color: "#3f3f46", marginTop: 3,
                  paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0,
                }}>
                  {formatTime(msg.created_at)}
                  {isMe && !msg.id.startsWith("temp-") && (
                    <span style={{ marginLeft: 4, color: msg.read ? G : "#52525b" }}>
                      {msg.read ? " ✓✓" : " ✓"}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(255,255,255,0.02)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "0 0 16px 16px",
        borderTop: "0.5px solid rgba(201,168,76,0.08)",
        flexShrink: 0,
      }}>
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "6px 12px",
            fontSize: 11, color: "#f87171", marginBottom: 10,
          }}>⚠ {error}</div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message Coach David… (Enter to send)"
            rows={1}
            style={{
              flex: 1, resize: "none", overflow: "hidden",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: "#e4e4e7", outline: "none",
              fontFamily: "inherit", lineHeight: 1.5, minHeight: 42,
              transition: "border-color 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(201,168,76,0.35)"; }}
            onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              border: "0.5px solid",
              cursor: input.trim() && !sending ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              background: input.trim() && !sending ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.02)",
              borderColor: input.trim() && !sending ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.06)",
            }}
          >
            {sending ? (
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "1.5px solid rgba(201,168,76,0.2)",
                borderTopColor: G, animation: "spin 0.6s linear infinite",
              }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14.5 1.5L7 9M14.5 1.5L10 14.5L7 9M14.5 1.5L1.5 5.5L7 9"
                  stroke={input.trim() ? G : "#52525b"}
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
