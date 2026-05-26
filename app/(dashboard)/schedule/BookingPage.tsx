"use client";
import { useState } from "react";

type Booking = {
  id: string; session_type: string; scheduled_at: string;
  status: string; notes: string | null; zoom_link: string | null;
  david_note: string | null; created_at: string;
};

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  label: "⏳ Pending" },
  confirmed: { color: "#3ecf8e", bg: "rgba(62,207,142,0.1)",  border: "rgba(62,207,142,0.3)",  label: "✓ Confirmed" },
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", label: "✕ Cancelled" },
};

const TIMES = [
  "7:00 AM","7:30 AM","8:00 AM","8:30 AM","9:00 AM","9:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM",
  "1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
  "4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM",
  "7:00 PM","7:30 PM","8:00 PM",
];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

export default function BookingPage({
  userId, userName, userEmail, bookings: initialBookings,
}: {
  userId: string; userName: string; userEmail: string;
  bookings: Booking[];
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [form, setForm] = useState({ sessionType: "online", date: "", time: "10:00 AM", notes: "" });
  const [submitting, setSubmitting]   = useState(false);
  const [cancelling, setCancelling]   = useState<string | null>(null);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const upcoming = bookings.filter(b => b.status !== "cancelled" && new Date(b.scheduled_at) >= new Date());
  const past     = bookings.filter(b => b.status === "cancelled" || new Date(b.scheduled_at) < new Date());

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Today's date as min for the date picker
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) { setError("Please select a date."); return; }
    setSubmitting(true); setError("");

    // Build ISO date from date + time selection
    const [time, meridiem] = [form.time.slice(0, -3), form.time.slice(-2)];
    let [h, m] = time.split(":").map(Number);
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    const dt = new Date(`${form.date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        sessionType:  form.sessionType,
        scheduledAt:  dt.toISOString(),
        notes:        form.notes,
        memberName:   userName,
        memberEmail:  userEmail,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      setError(json.error ?? "Something went wrong. Try again.");
    } else {
      setBookings(prev => [json.booking, ...prev]);
      setSuccess(true);
      setForm({ sessionType: "online", date: "", time: "10:00 AM", notes: "" });
      setTimeout(() => setSuccess(false), 5000);
    }
    setSubmitting(false);
  };

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled", cancelledByMember: true }),
    });
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
    }
    setCancelling(null);
    setConfirmCancel(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          Book a{" "}
          <span style={{ background: "linear-gradient(135deg,#00f2ff,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Session</span>
        </h1>
        <p style={{ fontSize: 13, color: "#a1a1aa" }}>Schedule a 1:1 coaching session with Coach David — online or in-person in Houston</p>
      </div>

      {/* Upcoming bookings */}
      {upcoming.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#52525b", letterSpacing: 1.5, textTransform: "uppercase" }}>Upcoming Sessions</p>
          {upcoming.map(b => {
            const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
            return (
              <div key={b.id} style={{
                background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "18px 20px",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: b.session_type === "online" ? "rgba(0,242,255,0.08)" : "rgba(139,92,246,0.08)",
                    border: `0.5px solid ${b.session_type === "online" ? "rgba(0,242,255,0.2)" : "rgba(139,92,246,0.2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>
                    {b.session_type === "online" ? "💻" : "🏋️"}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                      {b.session_type === "online" ? "Online Session (Zoom)" : "In-Person Session (Houston)"}
                    </p>
                    <p style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>
                      {fmtDate(b.scheduled_at)} · {fmtTime(b.scheduled_at)}
                    </p>
                    {b.zoom_link && b.status === "confirmed" && (
                      <a href={b.zoom_link} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: 11, color: "#00f2ff", fontWeight: 600,
                        background: "rgba(0,242,255,0.08)", border: "0.5px solid rgba(0,242,255,0.2)",
                        borderRadius: 8, padding: "3px 10px", textDecoration: "none",
                      }}>🔗 Join Zoom</a>
                    )}
                    {b.david_note && (
                      <p style={{ fontSize: 11, color: "#a1a1aa", marginTop: 6, fontStyle: "italic" }}>
                        David: "{b.david_note}"
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                  <span style={{
                    background: st.bg, border: `0.5px solid ${st.border}`,
                    borderRadius: 20, padding: "3px 10px",
                    fontSize: 10, fontWeight: 700, color: st.color,
                  }}>{st.label}</span>
                  {b.status === "pending" && (
                    <button
                      onClick={() => setConfirmCancel(b.id)}
                      style={{
                        background: "rgba(248,113,113,0.06)", border: "0.5px solid rgba(248,113,113,0.2)",
                        borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 600,
                        color: "#f87171", cursor: "pointer",
                      }}
                    >Cancel</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking form */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 20 }}>📅 Book a New Session</h2>

        {success && (
          <div style={{ background: "rgba(62,207,142,0.08)", border: "0.5px solid rgba(62,207,142,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#3ecf8e" }}>
            ✓ Booking submitted! Coach David will confirm soon — check your email.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Session type */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Session Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { value: "online",     icon: "💻", label: "Online (Zoom)",    sub: "Train from anywhere" },
                { value: "in-person",  icon: "🏋️", label: "In-Person",       sub: "Houston, TX location" },
              ].map(opt => (
                <button
                  key={opt.value} type="button"
                  onClick={() => set("sessionType", opt.value)}
                  style={{
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                    background: form.sessionType === opt.value ? "rgba(0,242,255,0.08)" : "rgba(255,255,255,0.02)",
                    border: `0.5px solid ${form.sessionType === opt.value ? "rgba(0,242,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: form.sessionType === opt.value ? "#00f2ff" : "#fff" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Preferred Date</label>
              <input
                type="date" value={form.date} min={today}
                onChange={e => set("date", e.target.value)} required
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", colorScheme: "dark" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Preferred Time</label>
              <select
                value={form.time} onChange={e => set("time", e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none" }}
              >
                {TIMES.map(t => <option key={t} value={t} style={{ background: "#111" }}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Goals / Notes for this session <span style={{ color: "#3f3f46", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
            <textarea
              value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="What do you want to work on? Any injuries or limitations David should know about?"
              rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: "#f87171" }}>⚠ {error}</p>}

          <button
            type="submit" disabled={submitting}
            style={{
              padding: "14px 0", borderRadius: 12,
              background: submitting ? "rgba(0,242,255,0.05)" : "linear-gradient(135deg,rgba(0,242,255,0.12),rgba(139,92,246,0.18))",
              border: "0.5px solid rgba(0,242,255,0.3)",
              fontSize: 14, fontWeight: 800, color: submitting ? "#52525b" : "#00f2ff",
              cursor: submitting ? "not-allowed" : "pointer", transition: "all 0.2s",
            } as React.CSSProperties}
          >
            {submitting ? "Sending request…" : "Request Session →"}
          </button>

          <p style={{ fontSize: 11, color: "#3f3f46", textAlign: "center" }}>
            David will confirm within 24 hours · You'll receive a confirmation email
          </p>
        </form>
      </div>

      {/* Past sessions */}
      {past.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#52525b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Past & Cancelled</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {past.map(b => {
              const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
              return (
                <div key={b.id} style={{ background: "rgba(255,255,255,0.01)", border: "0.5px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.6 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa", marginBottom: 2 }}>
                      {b.session_type === "online" ? "Online" : "In-Person"} · {fmtDate(b.scheduled_at)} {fmtTime(b.scheduled_at)}
                    </p>
                  </div>
                  <span style={{ background: st.bg, border: `0.5px solid ${st.border}`, borderRadius: 20, padding: "2px 9px", fontSize: 9, fontWeight: 700, color: st.color }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 360, width: "100%", background: "rgba(8,8,8,0.98)", border: "0.5px solid rgba(248,113,113,0.25)", borderRadius: 20, padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Cancel this session?</h2>
            <p style={{ fontSize: 12, color: "#71717a", marginBottom: 24 }}>Coach David will be notified. You can always rebook a new session.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleCancel(confirmCancel)}
                disabled={cancelling === confirmCancel}
                style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "0.5px solid rgba(248,113,113,0.3)", fontSize: 13, fontWeight: 700, color: "#f87171", cursor: "pointer" }}
              >
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
              <button onClick={() => setConfirmCancel(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 13, color: "#71717a", cursor: "pointer" }}>
                Keep It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
