"use client";
import { useState, useEffect, useCallback } from "react";

const G = "#c9a84c";
const HOUSTON = "America/Chicago";

type Booking = {
  id: string; session_type: string; scheduled_at: string;
  status: string; notes: string | null; zoom_link: string | null;
  david_note: string | null; member_timezone: string | null; created_at: string;
};

type SlotDetail = { label: string; utc: string };

// ── Timezone list (Americas + Europe — David's audience) ──────
const TIMEZONES = [
  { label: "Houston / Chicago (CT)",            tz: HOUSTON },
  { label: "New York / Miami (ET)",              tz: "America/New_York" },
  { label: "Denver (MT)",                        tz: "America/Denver" },
  { label: "Los Angeles / Seattle (PT)",         tz: "America/Los_Angeles" },
  { label: "Mexico City",                        tz: "America/Mexico_City" },
  { label: "Colombia / Peru",                    tz: "America/Bogota" },
  { label: "Venezuela",                          tz: "America/Caracas" },
  { label: "Bolivia",                            tz: "America/La_Paz" },
  { label: "Brazil / São Paulo",                 tz: "America/Sao_Paulo" },
  { label: "Argentina / Uruguay",                tz: "America/Argentina/Buenos_Aires" },
  { label: "Chile",                              tz: "America/Santiago" },
  { label: "London / Dublin (GMT/BST)",          tz: "Europe/London" },
  { label: "Lisbon / Canaries (WET)",            tz: "Europe/Lisbon" },
  { label: "Paris / Madrid / Rome / Berlin (CET)", tz: "Europe/Paris" },
  { label: "Athens / Istanbul (EET)",            tz: "Europe/Athens" },
  { label: "Dubai (GST)",                        tz: "Asia/Dubai" },
  { label: "Sydney, Australia (AEST)",           tz: "Australia/Sydney" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  label: "⏳ Pending confirmation" },
  confirmed: { color: "#3ecf8e", bg: "rgba(62,207,142,0.1)",  border: "rgba(62,207,142,0.3)",  label: "✓ Confirmed" },
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", label: "✕ Cancelled" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

// Format a UTC ISO string in a given timezone
const fmtInTZ = (isoStr: string, tz: string, opts: Intl.DateTimeFormatOptions = {}) => {
  try {
    return new Date(isoStr).toLocaleString("en-US", { timeZone: tz, ...opts });
  } catch { return ""; }
};

// Get TZ abbreviation (e.g., "CDT", "CET")
const tzAbbr = (tz: string): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date());
    return parts.find(p => p.type === "timeZoneName")?.value ?? "";
  } catch { return ""; }
};

// ── Mini Calendar ─────────────────────────────────────────────
function MiniCalendar({
  selected, onSelect, closedDays, blockedSet, loadingSlots,
}: {
  selected: string | null;
  onSelect: (date: string) => void;
  closedDays: Set<number>;
  blockedSet: Set<string>;
  loadingSlots: boolean;
}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year-1, month: 11 } : { year: v.year, month: v.month-1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year+1, month: 0  } : { year: v.year, month: v.month+1 });

  const firstDay    = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", color: "#a1a1aa", cursor: "pointer", fontSize: 14 }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{MONTHS[view.month]} {view.year}</span>
        <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", color: "#a1a1aa", cursor: "pointer", fontSize: 14 }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 0.5, padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date      = new Date(view.year, view.month, day);
          const dateStr   = toDateStr(date);
          const isPast    = date < today;
          const isClosed  = closedDays.has(date.getDay());
          const isBlocked = blockedSet.has(dateStr);
          const isDisabled = isPast || isClosed || isBlocked;
          const isSelected = selected === dateStr;
          const isToday    = toDateStr(date) === toDateStr(today);

          return (
            <button
              key={i}
              disabled={isDisabled}
              onClick={() => onSelect(dateStr)}
              style={{
                padding: "8px 4px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: isDisabled ? "not-allowed" : "pointer",
                border: isSelected ? `1.5px solid ${G}` : isToday ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                background: isSelected ? `rgba(201,168,76,0.18)` : isDisabled ? "transparent" : "rgba(255,255,255,0.03)",
                color: isSelected ? G : isDisabled ? "#2a2a2a" : "#e4e4e7",
                transition: "all 0.15s", position: "relative",
              } as React.CSSProperties}
            >
              {day}
              {isBlocked && !isPast && (
                <div style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#f87171" }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: `rgba(201,168,76,0.18)`, border: `1px solid ${G}` }} />
          <span style={{ fontSize: 10, color: "#52525b" }}>Selected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#f87171" }} />
          <span style={{ fontSize: 10, color: "#52525b" }}>Blocked</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "transparent", border: "1px solid #2a2a2a" }} />
          <span style={{ fontSize: 10, color: "#52525b" }}>Unavailable</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function BookingPage({
  userId, userName, userEmail, bookings: initialBookings,
}: {
  userId: string; userName: string; userEmail: string;
  bookings: Booking[];
}) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  // Availability state
  const [closedDays,  setClosedDays]  = useState<Set<number>>(new Set([0]));
  const [blockedSet,  setBlockedSet]  = useState<Set<string>>(new Set());
  const [availLoaded, setAvailLoaded] = useState(false);

  // Timezone — auto-detect from browser, member can override
  const [memberTz, setMemberTz] = useState(HOUSTON);
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setMemberTz(detected);
    } catch { /* keep default */ }
  }, []);

  // Booking form state
  const [selectedDate, setSelectedDate]     = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot]     = useState<string | null>(null);
  const [selectedSlotUtc, setSelectedSlotUtc] = useState<string | null>(null);
  const [slotDetails,   setSlotDetails]     = useState<SlotDetail[]>([]);
  const [loadingSlots,  setLoadingSlots]    = useState(false);
  const [sessionType,   setSessionType]     = useState("online");
  const [notes,         setNotes]           = useState("");
  const [submitting,    setSubmitting]      = useState(false);
  const [error,         setError]           = useState("");
  const [success,       setSuccess]         = useState(false);
  const [confirmCancel, setConfirmCancel]   = useState<string | null>(null);
  const [cancelling,    setCancelling]      = useState<string | null>(null);

  const upcoming = bookings.filter(b => b.status !== "cancelled" && new Date(b.scheduled_at) >= new Date());
  const past     = bookings.filter(b => b.status === "cancelled" || new Date(b.scheduled_at) < new Date());

  // Load availability on mount
  useEffect(() => {
    fetch("/api/availability")
      .then(r => r.json())
      .then(({ weekly, blocked }) => {
        const closed = new Set<number>(
          (weekly as Array<{ day_of_week: number; enabled: boolean }>)
            .filter(d => !d.enabled)
            .map(d => d.day_of_week),
        );
        const bSet = new Set<string>(
          (blocked as Array<{ date: string }>).map(b => b.date),
        );
        setClosedDays(closed);
        setBlockedSet(bSet);
        setAvailLoaded(true);
      })
      .catch(() => setAvailLoaded(true));
  }, []);

  // Fetch available slots when date changes
  const handleDateSelect = useCallback(async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedSlotUtc(null);
    setSlotDetails([]);
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/availability/slots?date=${date}`);
      const { slotDetails: sd } = await res.json();
      setSlotDetails(sd ?? []);
    } catch {
      setSlotDetails([]);
    }
    setLoadingSlots(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) { setError("Please select a date."); return; }
    if (!selectedSlotUtc) { setError("Please select a time slot."); return; }
    setSubmitting(true); setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId, sessionType, memberName: userName, memberEmail: userEmail,
        scheduledAt:    selectedSlotUtc,  // correct UTC from server — no local-TZ guessing
        memberTimezone: memberTz,
        notes,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      setError(json.error ?? "Something went wrong. Try again.");
    } else {
      setBookings(prev => [json.booking, ...prev]);
      setSuccess(true);
      setSelectedDate(null); setSelectedSlot(null); setSelectedSlotUtc(null); setSlotDetails([]);
      setNotes(""); setSessionType("online");
      setTimeout(() => setSuccess(false), 6000);
    }
    setSubmitting(false);
  };

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled", cancelledByMember: true }),
    });
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
    setCancelling(null);
    setConfirmCancel(null);
  };

  // Format a session time showing Houston CT + member's local time
  const fmtSessionTime = (isoStr: string, storedTz: string | null) => {
    const ct   = fmtInTZ(isoStr, HOUSTON, { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true, timeZoneName:"short" });
    const useTz = storedTz ?? memberTz;
    if (useTz === HOUSTON) return { primary: ct, local: null };
    const local = fmtInTZ(isoStr, useTz, { hour:"numeric", minute:"2-digit", hour12:true, timeZoneName:"short" });
    return { primary: ct, local };
  };

  const memberAbbr = tzAbbr(memberTz);
  const houstonAbbr = tzAbbr(HOUSTON);
  const tzIsHouston = memberTz === HOUSTON;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          Book a{" "}
          <span style={{ background: `linear-gradient(135deg,${G},#e8d5a3)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Session</span>
        </h1>
        <p style={{ fontSize: 13, color: "#a1a1aa" }}>
          Choose an available day, pick your time, and book directly with Coach David.
        </p>
      </div>

      {/* Upcoming sessions */}
      {upcoming.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#52525b", letterSpacing: 1.5, textTransform: "uppercase" }}>Your Upcoming Sessions</p>
          {upcoming.map(b => {
            const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
            const { primary: ctTime, local: localTime } = fmtSessionTime(b.scheduled_at, b.member_timezone);
            return (
              <div key={b.id} style={{
                background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "18px 20px",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: b.session_type === "online" ? "rgba(201,168,76,0.08)" : "rgba(139,92,246,0.08)",
                    border: `0.5px solid ${b.session_type === "online" ? "rgba(201,168,76,0.2)" : "rgba(139,92,246,0.2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>
                    {b.session_type === "online" ? "💻" : "🏋️"}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                      {b.session_type === "online" ? "Online Session (Zoom)" : "In-Person Session (Houston)"}
                    </p>
                    {/* Primary time: always Houston CT */}
                    <p style={{ fontSize: 12, color: "#71717a", marginBottom: 2 }}>{ctTime}</p>
                    {/* Member local time if different */}
                    {localTime && (
                      <p style={{ fontSize: 11, color: "#52525b", marginBottom: 6 }}>Your time: {localTime}</p>
                    )}
                    {b.zoom_link && b.status === "confirmed" && (
                      <a href={b.zoom_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: G, fontWeight: 600, background: "rgba(201,168,76,0.08)", border: `0.5px solid rgba(201,168,76,0.2)`, borderRadius: 8, padding: "3px 10px", textDecoration: "none" }}>🔗 Join Zoom</a>
                    )}
                    {b.david_note && (
                      <p style={{ fontSize: 11, color: "#a1a1aa", marginTop: 6, fontStyle: "italic" }}>David: "{b.david_note}"</p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                  <span style={{ background: st.bg, border: `0.5px solid ${st.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: st.color }}>{st.label}</span>
                  {b.status === "pending" && (
                    <button onClick={() => setConfirmCancel(b.id)} style={{ background: "rgba(248,113,113,0.06)", border: "0.5px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#f87171", cursor: "pointer" }}>Cancel</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking form */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 16 }}>📅 Book a New Session</h2>

        {success && (
          <div style={{ background: "rgba(62,207,142,0.08)", border: "0.5px solid rgba(62,207,142,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#3ecf8e" }}>
            ✓ Session booked! Coach David will confirm your slot shortly — you'll get an email confirmation.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Your Timezone selector */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Your Timezone
            </label>
            <select
              value={memberTz}
              onChange={e => setMemberTz(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", cursor: "pointer" }}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.tz} value={tz.tz} style={{ background: "#111" }}>{tz.label}</option>
              ))}
              {/* If detected TZ is not in our list, add it */}
              {!TIMEZONES.find(t => t.tz === memberTz) && memberTz && (
                <option value={memberTz} style={{ background: "#111" }}>{memberTz}</option>
              )}
            </select>
            {!tzIsHouston && (
              <p style={{ fontSize: 11, color: "#52525b", marginTop: 6 }}>
                Times are shown in both Houston CT (Coach David's time) and your local {memberAbbr}.
              </p>
            )}
          </div>

          {/* Session type */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Session Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { value: "online",    icon: "💻", label: "Online (Zoom)",  sub: "Train from anywhere" },
                { value: "in-person", icon: "🏋️", label: "In-Person",     sub: "Houston, TX location" },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setSessionType(opt.value)} style={{
                  padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  background: sessionType === opt.value ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.02)",
                  border: `0.5px solid ${sessionType === opt.value ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)"}`,
                  transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: sessionType === opt.value ? G : "#fff" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Select a Date
            </label>
            {availLoaded ? (
              <MiniCalendar
                selected={selectedDate}
                onSelect={handleDateSelect}
                closedDays={closedDays}
                blockedSet={blockedSet}
                loadingSlots={loadingSlots}
              />
            ) : (
              <div style={{ height: 200, background: "rgba(255,255,255,0.02)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: "#52525b" }}>Loading availability…</span>
              </div>
            )}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                Available Time Slots
                {selectedDate && (
                  <span style={{ color: "#3f3f46", fontWeight: 400, textTransform: "none", marginLeft: 8 }}>
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                )}
              </label>

              {loadingSlots ? (
                <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: "#52525b" }}>Loading slots…</div>
              ) : slotDetails.length === 0 ? (
                <div style={{ background: "rgba(248,113,113,0.05)", border: "0.5px solid rgba(248,113,113,0.15)", borderRadius: 12, padding: "16px 20px", fontSize: 13, color: "#f87171" }}>
                  No available slots on this day. Please select a different date.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slotDetails.map(slot => {
                    const isSelected = selectedSlot === slot.label;
                    // Member's local time for this slot
                    const localTime = !tzIsHouston
                      ? fmtInTZ(slot.utc, memberTz, { hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" })
                      : null;
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        onClick={() => { setSelectedSlot(slot.label); setSelectedSlotUtc(slot.utc); }}
                        style={{
                          padding: "10px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                          background: isSelected ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                          border: `0.5px solid ${isSelected ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.1)"}`,
                          transition: "all 0.15s",
                        }}
                      >
                        {/* Houston CT time */}
                        <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? G : "#a1a1aa" }}>
                          {slot.label}
                        </div>
                        {/* Member's local time (if different TZ) */}
                        {localTime && (
                          <div style={{ fontSize: 10, color: isSelected ? "rgba(201,168,76,0.7)" : "#52525b", marginTop: 2 }}>
                            {localTime} your time
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Goals / Notes <span style={{ color: "#3f3f46", fontWeight: 400, textTransform: "none" }}>(optional)</span>
            </label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="What do you want to work on? Any injuries or limitations David should know about?"
              rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: "#f87171" }}>⚠ {error}</p>}

          <button
            type="submit"
            disabled={submitting || !selectedDate || !selectedSlotUtc}
            style={{
              padding: "14px 0", borderRadius: 12,
              background: submitting || !selectedDate || !selectedSlotUtc
                ? "rgba(255,255,255,0.03)"
                : `linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.28))`,
              border: `0.5px solid ${submitting || !selectedDate || !selectedSlotUtc ? "rgba(255,255,255,0.07)" : "rgba(201,168,76,0.4)"}`,
              fontSize: 14, fontWeight: 800,
              color: submitting || !selectedDate || !selectedSlotUtc ? "#3f3f46" : G,
              cursor: submitting || !selectedDate || !selectedSlotUtc ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            } as React.CSSProperties}
          >
            {submitting ? "Sending request…" : selectedDate && selectedSlot ? `Book ${selectedSlot} →` : "Select a date and time to continue"}
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
              const ctTime = fmtInTZ(b.scheduled_at, HOUSTON, { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true, timeZoneName:"short" });
              return (
                <div key={b.id} style={{ background: "rgba(255,255,255,0.01)", border: "0.5px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa" }}>
                    {b.session_type === "online" ? "Online" : "In-Person"} · {ctTime}
                  </p>
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
            <p style={{ fontSize: 12, color: "#71717a", marginBottom: 24 }}>Coach David will be notified. You can always rebook.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleCancel(confirmCancel)} disabled={!!cancelling} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "0.5px solid rgba(248,113,113,0.3)", fontSize: 13, fontWeight: 700, color: "#f87171", cursor: "pointer" }}>
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
              <button onClick={() => setConfirmCancel(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 13, color: "#71717a", cursor: "pointer" }}>Keep It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
