"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PrivateMessage } from "./PrivateChat";

const G = "#c9a84c";

const formatTime = (ts: string) => {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

type Conversation = {
  memberId: string;
  memberName: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  messages: PrivateMessage[];
};

export default function AdminInbox({
  davidId,
  initialMessages,
  memberNames,
}: {
  davidId: string;
  initialMessages: PrivateMessage[];
  memberNames: Record<string, string>;
}) {
  // Build conversation list from all messages
  const buildConversations = (msgs: PrivateMessage[]): Conversation[] => {
    const map = new Map<string, Conversation>();

    for (const msg of msgs) {
      const memberId = msg.sender_id === davidId ? msg.receiver_id : msg.sender_id;
      const memberName = memberNames[memberId] ?? "Member";

      if (!map.has(memberId)) {
        map.set(memberId, {
          memberId, memberName,
          lastMessage: msg.content,
          lastAt: msg.created_at,
          unread: 0,
          messages: [],
        });
      }
      const conv = map.get(memberId)!;
      conv.messages.push(msg);
      if (new Date(msg.created_at) > new Date(conv.lastAt)) {
        conv.lastMessage = msg.content;
        conv.lastAt = msg.created_at;
      }
      if (msg.sender_id !== davidId && !msg.read) {
        conv.unread++;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    );
  };

  const [allMessages, setAllMessages]   = useState<PrivateMessage[]>(initialMessages);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [input, setInput]               = useState("");
  const [sending, setSending]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const sentIdsRef     = useRef<Set<string>>(new Set());
  const isFirstRender  = useRef(true);

  const conversations = buildConversations(allMessages);
  const selected      = conversations.find(c => c.memberId === selectedId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isFirstRender.current ? "instant" : "smooth",
    } as ScrollIntoViewOptions);
    isFirstRender.current = false;
  }, [selected?.messages.length]);

  // Mark selected conversation as read
  useEffect(() => {
    if (!selectedId) return;
    createClient()
      .from("private_messages")
      .update({ read: true })
      .eq("sender_id", selectedId)
      .eq("receiver_id", davidId)
      .eq("read", false)
      .then(() => {
        setAllMessages(prev =>
          prev.map(m =>
            m.sender_id === selectedId && m.receiver_id === davidId
              ? { ...m, read: true }
              : m
          )
        );
      });
  }, [selectedId, davidId]);

  // Realtime — all private_messages (David sees everything)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages" },
        (payload: { new: PrivateMessage }) => {
          const msg = payload.new;
          if (msg.sender_id !== davidId && msg.receiver_id !== davidId) return;
          if (sentIdsRef.current.has(msg.id)) {
            sentIdsRef.current.delete(msg.id);
            return;
          }
          setAllMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [davidId]);

  const sendReply = async () => {
    if (!selectedId || !input.trim() || sending) return;
    const trimmed = input.trim();
    setError(null);
    setSending(true);
    setInput("");

    const tempMsg: PrivateMessage = {
      id: `temp-${Date.now()}`,
      sender_id: davidId,
      receiver_id: selectedId,
      content: trimmed,
      read: false,
      created_at: new Date().toISOString(),
    };
    setAllMessages(prev => [...prev, tempMsg]);

    const { data, error: dbErr } = await createClient()
      .from("private_messages")
      .insert({ sender_id: davidId, receiver_id: selectedId, content: trimmed })
      .select()
      .single();

    if (dbErr) {
      setAllMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(trimmed);
      setError("Failed to send. Try again.");
    } else if (data) {
      sentIdsRef.current.add(data.id);
      setAllMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m));
    }
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  return (
    <div style={{
      display: "flex", height: "calc(100vh - 190px)", minHeight: 480,
      border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden",
    }}>

      {/* ── LEFT: Conversation List ── */}
      <div style={{
        width: 280, flexShrink: 0,
        background: "rgba(255,255,255,0.02)",
        borderRight: "0.5px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "16px 16px 12px",
          borderBottom: "0.5px solid rgba(255,255,255,0.05)",
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Member Inbox</h2>
          <p style={{ fontSize: 10, color: "#52525b", marginTop: 2, marginBottom: 0 }}>
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", opacity: 0.4 }}>
              <p style={{ fontSize: 12, color: "#a1a1aa" }}>No messages yet</p>
            </div>
          )}

          {conversations.map(conv => {
            const isSelected = conv.memberId === selectedId;
            return (
              <button
                key={conv.memberId}
                onClick={() => {
                  isFirstRender.current = true;
                  setSelectedId(conv.memberId);
                }}
                style={{
                  width: "100%", textAlign: "left", padding: "12px 16px",
                  background: isSelected ? "rgba(201,168,76,0.06)" : "transparent",
                  borderLeft: isSelected ? `2px solid ${G}` : "2px solid transparent",
                  borderTop: "none", borderRight: "none",
                  borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#a1a1aa",
                  }}>
                    {conv.memberName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? G : "#e4e4e7" }}>
                        {conv.memberName}
                      </span>
                      <span style={{ fontSize: 9, color: "#52525b" }}>
                        {formatTime(conv.lastAt)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                      <span style={{
                        fontSize: 11, color: "#71717a",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        maxWidth: 150,
                      }}>
                        {conv.lastMessage}
                      </span>
                      {conv.unread > 0 && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: "#080808",
                          background: G, borderRadius: 10,
                          padding: "1px 6px", flexShrink: 0, marginLeft: 4,
                        }}>{conv.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Conversation ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* No selection */}
        {!selected && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, opacity: 0.4,
          }}>
            <span style={{ fontSize: 36 }}>💬</span>
            <p style={{ fontSize: 13, color: "#a1a1aa" }}>Select a conversation to reply</p>
          </div>
        )}

        {selected && (
          <>
            {/* Conversation header */}
            <div style={{
              padding: "14px 20px",
              background: "rgba(255,255,255,0.02)",
              borderBottom: "0.5px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#a1a1aa",
              }}>
                {selected.memberName[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>
                  {selected.memberName}
                </p>
                <p style={{ fontSize: 10, color: "#52525b", margin: 0 }}>Elite member</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "16px 20px",
              display: "flex", flexDirection: "column",
              scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent",
            }}>
              {selected.messages.map((msg, i) => {
                const isMe   = msg.sender_id === davidId;
                const sameSender = selected.messages[i - 1]?.sender_id === msg.sender_id;

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
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800, color: "#a1a1aa",
                        opacity: sameSender ? 0 : 1,
                      }}>
                        {selected.memberName[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div style={{
                      maxWidth: "68%", display: "flex", flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start",
                    }}>
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

            {/* Reply input */}
            <div style={{
              padding: "12px 16px",
              borderTop: "0.5px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)", flexShrink: 0,
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
                  placeholder={`Reply to ${selected.memberName}… (Enter to send)`}
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
                  onClick={sendReply}
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
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
