"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLAN_COLOR } from "@/lib/planUtils";
import { compressImage } from "@/lib/compressImage";

// ── Types ─────────────────────────────────────────────────────
type Member = {
  id: string; full_name: string | null; email: string | null;
  role: string | null; created_at: string;
  memberships: Array<{ plan: string; status: string }>;
};
type Video = {
  id: string; title: string; description: string | null;
  duration: string | null; category: string | null;
  thumbnail_url: string | null; video_url: string | null;
  calories: number | null; min_plan: string | null;
  published: boolean; created_at: string;
};
type Recipe = {
  id: string; title: string; description: string | null;
  category: string | null; calories: number | null; prep_time: string | null;
  ingredients: string[] | null; instructions: string[] | null;
  image_url: string | null; min_plan: string | null;
  published: boolean; created_at: string;
};
type Booking = {
  id: string; user_id: string;
  session_type: "online" | "in-person";
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null; zoom_link: string | null; david_note: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
};

// ── Constants ─────────────────────────────────────────────────
const TABS = ["Overview", "Members", "Bookings", "Videos", "Recipes"];

const PLAN_BG: Record<string, string> = {
  base: "rgba(161,161,170,0.1)", pro: "rgba(0,242,255,0.1)", elite: "rgba(139,92,246,0.12)",
};
const PLAN_BORDER: Record<string, string> = {
  base: "rgba(161,161,170,0.25)", pro: "rgba(0,242,255,0.25)", elite: "rgba(139,92,246,0.3)",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", confirmed: "#3ecf8e", cancelled: "#71717a",
};
const STATUS_BG: Record<string, string> = {
  pending: "rgba(245,158,11,0.08)", confirmed: "rgba(62,207,142,0.08)", cancelled: "rgba(255,255,255,0.03)",
};
const STATUS_BORDER: Record<string, string> = {
  pending: "rgba(245,158,11,0.25)", confirmed: "rgba(62,207,142,0.2)", cancelled: "rgba(255,255,255,0.07)",
};

const CAT_COLORS: Record<string, string> = {
  strength: "#00f2ff", hiit: "#ef4444", mobility: "#8b5cf6",
  cardio: "#f59e0b", recovery: "#3ecf8e",
  "high-protein": "#00f2ff", "pre-workout": "#f59e0b", "meal-plan": "#8b5cf6",
};
const catColor = (c: string | null) => CAT_COLORS[c?.toLowerCase() ?? ""] ?? "#a1a1aa";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtDateTime = (d: string) => {
  const dt = new Date(d);
  return {
    date: dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
};

// ── Shared UI ─────────────────────────────────────────────────
function Badge({ label, plan }: { label: string; plan: string }) {
  return (
    <span style={{
      background: PLAN_BG[plan] ?? "rgba(255,255,255,0.06)",
      border: `0.5px solid ${PLAN_BORDER[plan] ?? "rgba(255,255,255,0.1)"}`,
      borderRadius: 20, padding: "2px 9px",
      fontSize: 9, fontWeight: 800, letterSpacing: 1,
      color: PLAN_COLOR[plan] ?? "#a1a1aa", textTransform: "uppercase",
    }}>{label}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      background: STATUS_BG[status] ?? "rgba(255,255,255,0.03)",
      border: `0.5px solid ${STATUS_BORDER[status] ?? "rgba(255,255,255,0.07)"}`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 9, fontWeight: 800, letterSpacing: 1,
      color: STATUS_COLOR[status] ?? "#a1a1aa", textTransform: "uppercase",
    }}>{status}</span>
  );
}

function ActionBtn({ label, color, onClick, disabled }: { label: string; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)",
      borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 600,
      color: disabled ? "#3f3f46" : color, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }}>{label}</button>
  );
}

// ── Published Toggle ──────────────────────────────────────────
function PublishedToggle({ published, onChange }: { published: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      width: 36, height: 20, borderRadius: 10, cursor: "pointer", border: "none",
      background: published ? "rgba(62,207,142,0.25)" : "rgba(255,255,255,0.06)",
      borderColor: published ? "rgba(62,207,142,0.4)" : "rgba(255,255,255,0.1)",
      borderStyle: "solid", borderWidth: "0.5px",
      position: "relative", transition: "all 0.2s", flexShrink: 0,
    } as React.CSSProperties}>
      <div style={{
        width: 14, height: 14, borderRadius: "50%",
        background: published ? "#3ecf8e" : "#52525b",
        position: "absolute", top: 2,
        left: published ? 18 : 2, transition: "all 0.2s",
      }} />
    </button>
  );
}

// ── Confirm Booking Modal ─────────────────────────────────────
function ConfirmModal({
  booking, onClose, onUpdated,
}: {
  booking: Booking; onClose: () => void; onUpdated: (row: any) => void;
}) {
  const isOnline = booking.session_type === "online";
  const { date, time } = fmtDateTime(booking.scheduled_at);
  const memberName = booking.profiles?.full_name ?? "Member";

  const [zoomLink,  setZoomLink]  = useState(booking.zoom_link  ?? "");
  const [davidNote, setDavidNote] = useState(booking.david_note ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const handleConfirm = async () => {
    if (isOnline && !zoomLink.trim()) {
      setErr("Zoom link is required for online sessions."); return;
    }
    setSaving(true); setErr("");
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:    "confirmed",
        zoomLink:  zoomLink.trim()  || undefined,
        davidNote: davidNote.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Something went wrong"); setSaving(false); return; }
    onUpdated(data.booking);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,6,0.99)", border: "0.5px solid rgba(62,207,142,0.2)", borderRadius: 20, padding: 28 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Confirm Session</h2>
            <p style={{ fontSize: 12, color: "#3ecf8e" }}>✉ Member will be notified by email</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#a1a1aa", cursor: "pointer" }}>✕</button>
        </div>

        {/* Session details */}
        <div style={{ background: "rgba(62,207,142,0.06)", border: "0.5px solid rgba(62,207,142,0.12)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{memberName}</p>
          <p style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 3 }}>
            <span style={{ color: "#52525b" }}>Type: </span>
            {isOnline ? "Online (Zoom)" : "In-Person (Houston)"}
          </p>
          <p style={{ fontSize: 12, color: "#a1a1aa" }}>
            <span style={{ color: "#52525b" }}>When: </span>
            {date} at {time}
          </p>
          {booking.notes && (
            <p style={{ fontSize: 11, color: "#71717a", marginTop: 8, fontStyle: "italic" }}>
              "{booking.notes}"
            </p>
          )}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isOnline && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Zoom Link <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                type="url"
                placeholder="https://zoom.us/j/..."
                value={zoomLink}
                onChange={e => setZoomLink(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `0.5px solid ${!zoomLink && err ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Message to Member <span style={{ color: "#3f3f46" }}>(optional)</span>
            </label>
            <textarea
              placeholder="e.g. See you tomorrow — come ready to work! 💪"
              value={davidNote}
              onChange={e => setDavidNote(e.target.value)}
              rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {err && <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>⚠ {err}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={handleConfirm} disabled={saving} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "linear-gradient(135deg,rgba(62,207,142,0.12),rgba(62,207,142,0.22))", border: "0.5px solid rgba(62,207,142,0.35)", fontSize: 13, fontWeight: 700, color: "#3ecf8e", cursor: "pointer" }}>
            {saving ? "Confirming…" : "Confirm & Notify Member ✓"}
          </button>
          <button onClick={onClose} style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 13, color: "#71717a", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Booking Modal ──────────────────────────────────────
function CancelBookingModal({
  booking, onClose, onUpdated,
}: {
  booking: Booking; onClose: () => void; onUpdated: (row: any) => void;
}) {
  const { date, time } = fmtDateTime(booking.scheduled_at);
  const memberName = booking.profiles?.full_name ?? "Member";

  const [davidNote, setDavidNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const handleCancel = async () => {
    setSaving(true); setErr("");
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status:    "cancelled",
        davidNote: davidNote.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Something went wrong"); setSaving(false); return; }
    onUpdated(data.booking);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,6,0.99)", border: "0.5px solid rgba(239,68,68,0.2)", borderRadius: 20, padding: 28 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Cancel Session</h2>
            <p style={{ fontSize: 12, color: "#f87171" }}>✉ Member will be notified by email</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#a1a1aa", cursor: "pointer" }}>✕</button>
        </div>

        {/* Session details */}
        <div style={{ background: "rgba(239,68,68,0.05)", border: "0.5px solid rgba(239,68,68,0.12)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{memberName}</p>
          <p style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 3 }}>
            <span style={{ color: "#52525b" }}>Type: </span>
            {booking.session_type === "online" ? "Online (Zoom)" : "In-Person (Houston)"}
          </p>
          <p style={{ fontSize: 12, color: "#a1a1aa" }}>
            <span style={{ color: "#52525b" }}>When: </span>
            {date} at {time}
          </p>
        </div>

        {/* Reason field */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Reason for {memberName} <span style={{ color: "#3f3f46" }}>(optional)</span>
          </label>
          <textarea
            placeholder="e.g. Emergency came up — I'll reach out to reschedule soon."
            value={davidNote}
            onChange={e => setDavidNote(e.target.value)}
            rows={3}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        {err && <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>⚠ {err}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={handleCancel} disabled={saving} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.35)", fontSize: 13, fontWeight: 700, color: "#f87171", cursor: "pointer" }}>
            {saving ? "Cancelling…" : "Cancel & Notify Member"}
          </button>
          <button onClick={onClose} style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 13, color: "#71717a", cursor: "pointer" }}>Keep Session</button>
        </div>
      </div>
    </div>
  );
}

// ── Video Modal ───────────────────────────────────────────────
function VideoModal({
  editing, onClose, onSaved,
}: {
  editing: Video | null; onClose: () => void; onSaved: (v: Video) => void;
}) {
  const isEdit = !!editing?.id;
  const [form, setForm] = useState({
    title:         editing?.title         ?? "",
    description:   editing?.description   ?? "",
    duration:      editing?.duration      ?? "",
    category:      editing?.category      ?? "strength",
    video_url:     editing?.video_url     ?? "",
    thumbnail_url: editing?.thumbnail_url ?? "",
    calories:      editing?.calories      ?? "",
    min_plan:      editing?.min_plan      ?? "base",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr("");
    const supabase = createClient();
    const payload = { ...form, calories: form.calories ? Number(form.calories) : null };

    if (isEdit) {
      const { data, error } = await supabase.from("videos").update(payload).eq("id", editing!.id).select().single();
      if (error) { setErr(error.message); setSaving(false); return; }
      onSaved(data as Video);
    } else {
      const { data, error } = await supabase.from("videos").insert({ ...payload, published: true }).select().single();
      if (error) { setErr(error.message); setSaving(false); return; }
      onSaved(data as Video);
    }
    setSaving(false);
  };

  const fields: Array<{ key: string; label: string; type?: string; as?: string; options?: string[] }> = [
    { key: "title",         label: "Title *" },
    { key: "description",   label: "Description",   as: "textarea" },
    { key: "video_url",     label: "Video URL (YouTube)" },
    { key: "thumbnail_url", label: "Thumbnail URL" },
    { key: "duration",      label: "Duration (e.g. 22:00)" },
    { key: "calories",      label: "Calories (kcal)", type: "number" },
    { key: "category",      label: "Category", as: "select",
      options: ["strength", "hiit", "mobility", "cardio", "recovery"] },
    { key: "min_plan",      label: "Minimum Plan", as: "select",
      options: ["base", "pro", "elite"] },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", background: "rgba(8,8,8,0.98)", border: "0.5px solid rgba(0,242,255,0.15)", borderRadius: 20, padding: 28 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{isEdit ? "Edit Video" : "Add New Video"}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#a1a1aa", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{f.label}</label>
              {f.as === "select" ? (
                <select value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none" }}>
                  {f.options?.map(o => <option key={o} value={o} style={{ background: "#111" }}>{o}</option>)}
                </select>
              ) : f.as === "textarea" ? (
                <textarea value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} rows={2} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              ) : (
                <input type={f.type ?? "text"} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none" }} />
              )}
            </div>
          ))}
        </div>

        {err && <p style={{ fontSize: 12, color: "#f87171", marginTop: 12 }}>⚠ {err}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "linear-gradient(135deg,rgba(0,242,255,0.12),rgba(0,242,255,0.22))", border: "0.5px solid rgba(0,242,255,0.35)", fontSize: 13, fontWeight: 700, color: "#00f2ff", cursor: "pointer" }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Video"}
          </button>
          <button onClick={onClose} style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 13, color: "#71717a", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Recipe Modal ──────────────────────────────────────────────
function RecipeModal({
  editing, onClose, onSaved,
}: {
  editing: Recipe | null; onClose: () => void; onSaved: (r: Recipe) => void;
}) {
  const isEdit = !!editing?.id;
  const [form, setForm] = useState({
    title:        editing?.title        ?? "",
    description:  editing?.description  ?? "",
    category:     editing?.category     ?? "high-protein",
    calories:     editing?.calories     ?? "",
    prep_time:    editing?.prep_time    ?? "",
    ingredients:  (editing?.ingredients ?? []).join("\n"),
    instructions: (editing?.instructions ?? []).join("\n"),
    min_plan:     editing?.min_plan     ?? "base",
    image_url:    editing?.image_url    ?? "",
  });
  const [saving,       setSaving]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [err,          setErr]          = useState("");
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (file: File) => {
    setUploading(true); setErr("");
    const supabase = createClient();
    const compressed = await compressImage(file, 1000, 0.85);
    const path = `${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("recipe-images")
      .upload(path, compressed, { upsert: true });
    if (upErr) { setErr("Image upload failed: " + upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("recipe-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr("");
    const supabase = createClient();
    const payload = {
      title:        form.title,
      description:  form.description || null,
      category:     form.category,
      calories:     form.calories ? Number(form.calories) : null,
      prep_time:    form.prep_time || null,
      ingredients:  form.ingredients.split("\n").map(s => s.trim()).filter(Boolean),
      instructions: form.instructions.split("\n").map(s => s.trim()).filter(Boolean),
      min_plan:     form.min_plan,
      image_url:    form.image_url || null,
    };

    if (isEdit) {
      const { data, error } = await supabase.from("recipes").update(payload).eq("id", editing!.id).select().single();
      if (error) { setErr(error.message); setSaving(false); return; }
      onSaved(data as Recipe);
    } else {
      const { data, error } = await supabase.from("recipes").insert({ ...payload, published: true }).select().single();
      if (error) { setErr(error.message); setSaving(false); return; }
      onSaved(data as Recipe);
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", background: "rgba(8,8,8,0.98)", border: "0.5px solid rgba(139,92,246,0.15)", borderRadius: 20, padding: 28 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{isEdit ? "Edit Recipe" : "Add New Recipe"}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#a1a1aa", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "title",        label: "Title *" },
            { key: "description",  label: "Description",    as: "textarea" },
            { key: "category",     label: "Category",       as: "select", options: ["high-protein","recovery","pre-workout","meal-plan"] },
            { key: "min_plan",     label: "Minimum Plan",   as: "select", options: ["base","pro","elite"] },
            { key: "calories",     label: "Calories (kcal)", type: "number" },
            { key: "prep_time",    label: "Prep Time (e.g. 25 min)" },
            { key: "ingredients",  label: "Ingredients (one per line)", as: "textarea", rows: 5 },
            { key: "instructions", label: "Instructions (one per line)", as: "textarea", rows: 5 },
          ].map((f: any) => (
            <div key={f.key}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{f.label}</label>
              {f.as === "select" ? (
                <select value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none" }}>
                  {f.options.map((o: string) => <option key={o} value={o} style={{ background: "#111" }}>{o}</option>)}
                </select>
              ) : f.as === "textarea" ? (
                <textarea value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} rows={f.rows ?? 2} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              ) : (
                <input type={f.type ?? "text"} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none" }} />
              )}
            </div>
          ))}

          {/* Image upload */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Recipe Image
            </label>

            {/* Preview */}
            {form.image_url && (
              <div style={{ position: "relative", marginBottom: 10, borderRadius: 10, overflow: "hidden", border: "0.5px solid rgba(139,92,246,0.2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="Recipe" style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
                <button
                  onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#f87171", cursor: "pointer" }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Upload zone */}
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "14px", borderRadius: 8, cursor: uploading ? "not-allowed" : "pointer",
              background: "rgba(139,92,246,0.05)", border: "0.5px dashed rgba(139,92,246,0.3)",
              fontSize: 12, color: uploading ? "#52525b" : "#8b5cf6", fontWeight: 600,
              transition: "all 0.15s",
            }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
              />
              {uploading ? "⏳ Uploading…" : form.image_url ? "📷 Replace Image" : "📷 Upload Image"}
            </label>
          </div>
        </div>

        {err && <p style={{ fontSize: 12, color: "#f87171", marginTop: 12 }}>⚠ {err}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={handleSave} disabled={saving || uploading} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "linear-gradient(135deg,rgba(139,92,246,0.12),rgba(139,92,246,0.22))", border: "0.5px solid rgba(139,92,246,0.35)", fontSize: 13, fontWeight: 700, color: "#8b5cf6", cursor: "pointer" }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Recipe"}
          </button>
          <button onClick={onClose} style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 13, color: "#71717a", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────
function DeleteConfirm({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(8,8,8,0.98)", border: "0.5px solid rgba(239,68,68,0.25)", borderRadius: 20, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗑</div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Delete {label}?</h2>
        <p style={{ fontSize: 12, color: "#71717a", marginBottom: 24 }}>This cannot be undone.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.35)", fontSize: 13, fontWeight: 700, color: "#f87171", cursor: "pointer" }}>Delete</button>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 13, color: "#71717a", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AdminPanel({
  members: initialMembers,
  videos: initialVideos,
  recipes: initialRecipes,
  bookings: initialBookings,
}: {
  members:  Member[];
  videos:   Video[];
  recipes:  Recipe[];
  bookings: Booking[];
}) {
  const [tab, setTab]         = useState("Overview");
  const [members]             = useState<Member[]>(initialMembers);
  const [videos,   setVideos]   = useState<Video[]>(initialVideos);
  const [recipes,  setRecipes]  = useState<Recipe[]>(initialRecipes);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const [bookingFilter, setBookingFilter] = useState<"All" | "pending" | "confirmed" | "cancelled">("All");
  const [confirmTarget,  setConfirmTarget]  = useState<Booking | null>(null);
  const [cancelTarget,   setCancelTarget]   = useState<Booking | null>(null);

  const [videoModal,  setVideoModal]  = useState<{ open: boolean; editing: Video | null }>({ open: false, editing: null });
  const [recipeModal, setRecipeModal] = useState<{ open: boolean; editing: Recipe | null }>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<{ type: "video" | "recipe"; id: string; title: string } | null>(null);

  // ── Booking handlers ─────────────────────────────────────
  const handleBookingUpdated = (updatedRow: any) => {
    setBookings(prev => prev.map(b =>
      b.id === updatedRow.id
        ? { ...b, status: updatedRow.status, zoom_link: updatedRow.zoom_link ?? b.zoom_link, david_note: updatedRow.david_note ?? b.david_note }
        : b
    ));
    setConfirmTarget(null);
    setCancelTarget(null);
  };

  const filteredBookings = bookings.filter(b =>
    bookingFilter === "All" ? true : b.status === bookingFilter
  );

  const now = new Date();
  const pendingCount      = bookings.filter(b => b.status === "pending").length;
  const upcomingConfirmed = bookings.filter(b => b.status === "confirmed" && new Date(b.scheduled_at) > now).length;

  // ── Content handlers ─────────────────────────────────────
  const togglePublished = async (type: "video" | "recipe", id: string, current: boolean) => {
    const supabase = createClient();
    const table = type === "video" ? "videos" : "recipes";
    await supabase.from(table).update({ published: !current }).eq("id", id);
    if (type === "video") setVideos(prev => prev.map(v => v.id === id ? { ...v, published: !current } : v));
    else setRecipes(prev => prev.map(r => r.id === id ? { ...r, published: !current } : r));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();
    const table = deleteTarget.type === "video" ? "videos" : "recipes";
    await supabase.from(table).delete().eq("id", deleteTarget.id);
    if (deleteTarget.type === "video") setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
    else setRecipes(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // ── Stats ────────────────────────────────────────────────
  const totalMembers  = members.filter(m => m.role !== "admin").length;
  const proMembers    = members.filter(m => m.memberships?.[0]?.plan === "pro").length;
  const eliteMembers  = members.filter(m => m.memberships?.[0]?.plan === "elite").length;
  const weekAgo       = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek   = members.filter(m => new Date(m.created_at) > weekAgo).length;
  const publishedVids = videos.filter(v => v.published).length;
  const publishedRecs = recipes.filter(r => r.published).length;

  const rowStyle: React.CSSProperties = {
    display: "grid", alignItems: "center",
    borderBottom: "0.5px solid rgba(255,255,255,0.04)",
    padding: "12px 0",
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    cursor: "pointer", border: `0.5px solid ${active ? "rgba(0,242,255,0.3)" : "rgba(255,255,255,0.07)"}`,
    background: active ? "rgba(0,242,255,0.08)" : "rgba(255,255,255,0.02)",
    color: active ? "#00f2ff" : "#71717a", transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
            Admin{" "}
            <span style={{ background: "linear-gradient(135deg,#00f2ff,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Panel</span>
          </h1>
          <p style={{ fontSize: 13, color: "#a1a1aa" }}>Manage your platform, members, and content</p>
        </div>
        <span style={{ background: "rgba(139,92,246,0.12)", border: "0.5px solid rgba(139,92,246,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#8b5cf6" }}>ADMIN</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", background: "transparent",
            color: tab === t ? "#fff" : "#a1a1aa",
            borderBottom: tab === t ? "2px solid #00f2ff" : "2px solid transparent",
            transition: "all 0.2s", marginBottom: -1,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t}
            {t === "Bookings" && pendingCount > 0 && (
              <span style={{
                background: "rgba(245,158,11,0.18)", border: "0.5px solid rgba(245,158,11,0.4)",
                borderRadius: 10, padding: "1px 7px", fontSize: 9, fontWeight: 900,
                color: "#f59e0b",
              }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "Overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12 }}>
            {[
              { label: "Total Members",     value: totalMembers,      icon: "👥", color: "#00f2ff" },
              { label: "Pro Members",       value: proMembers,        icon: "⚡", color: "#00f2ff" },
              { label: "Elite Members",     value: eliteMembers,      icon: "👑", color: "#8b5cf6" },
              { label: "New This Week",     value: newThisWeek,       icon: "🆕", color: "#3ecf8e" },
              { label: "Pending Bookings",  value: pendingCount,      icon: "📅", color: "#f59e0b" },
              { label: "Upcoming Sessions", value: upcomingConfirmed, icon: "✅", color: "#3ecf8e" },
              { label: "Videos Live",       value: publishedVids,     icon: "▶",  color: "#f59e0b" },
              { label: "Recipes Live",      value: publishedRecs,     icon: "🥗", color: "#8b5cf6" },
            ].map(s => (
              <div key={s.label} style={{
                background: s.label === "Pending Bookings" && pendingCount > 0
                  ? "rgba(245,158,11,0.04)"
                  : "rgba(255,255,255,0.02)",
                border: s.label === "Pending Bookings" && pendingCount > 0
                  ? "0.5px solid rgba(245,158,11,0.2)"
                  : "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "18px 20px",
              }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1, margin: "8px 0 4px" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent signups */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Recent Signups</p>
            {members.slice(0, 5).map(m => {
              const plan = m.memberships?.[0]?.plan ?? "none";
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(0,242,255,0.1)", border: "0.5px solid rgba(0,242,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#00f2ff", flexShrink: 0 }}>
                    {(m.full_name?.[0] ?? m.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.full_name ?? m.email}</p>
                    <p style={{ fontSize: 10, color: "#52525b", margin: 0 }}>{fmtDate(m.created_at)}</p>
                  </div>
                  {plan !== "none" && <Badge label={plan} plan={plan} />}
                </div>
              );
            })}
          </div>

          {/* Pending bookings alert */}
          {pendingCount > 0 && (
            <div style={{ background: "rgba(245,158,11,0.06)", border: "0.5px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 3 }}>
                  ⚡ {pendingCount} booking{pendingCount > 1 ? "s" : ""} need{pendingCount === 1 ? "s" : ""} your attention
                </p>
                <p style={{ fontSize: 11, color: "#71717a" }}>Confirm or cancel pending sessions to notify your members.</p>
              </div>
              <button onClick={() => setTab("Bookings")} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(245,158,11,0.12)", border: "0.5px solid rgba(245,158,11,0.3)", fontSize: 12, fontWeight: 700, color: "#f59e0b", cursor: "pointer", flexShrink: 0 }}>
                View →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MEMBERS ── */}
      {tab === "Members" && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{totalMembers} Members</p>
          </div>
          <div style={{ ...rowStyle, gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "8px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            {["Name", "Email", "Plan", "Status", "Joined"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>
          {members.map(m => {
            const plan   = m.memberships?.[0]?.plan   ?? "none";
            const status = m.memberships?.[0]?.status ?? "—";
            return (
              <div key={m.id} style={{ ...rowStyle, gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", padding: "10px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,242,255,0.08)", border: "0.5px solid rgba(0,242,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#00f2ff", flexShrink: 0 }}>
                    {(m.full_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.full_name ?? "—"}
                    {m.role === "admin" && <span style={{ marginLeft: 6, fontSize: 9, color: "#8b5cf6", fontWeight: 800 }}>ADMIN</span>}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</span>
                <div>
                  {plan !== "none"
                    ? <Badge label={plan} plan={plan} />
                    : <span style={{ fontSize: 11, color: "#3f3f46" }}>No plan</span>
                  }
                </div>
                <span style={{ fontSize: 11, color: status === "active" ? "#3ecf8e" : "#71717a" }}>{status}</span>
                <span style={{ fontSize: 11, color: "#52525b" }}>{fmtDate(m.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BOOKINGS ── */}
      {tab === "Bookings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Filter chips + count */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {(["All", "pending", "confirmed", "cancelled"] as const).map(f => (
                <button key={f} onClick={() => setBookingFilter(f)} style={filterBtnStyle(bookingFilter === f)}>
                  {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "pending" && pendingCount > 0 && (
                    <span style={{ marginLeft: 5, background: "rgba(245,158,11,0.2)", borderRadius: 10, padding: "0px 5px", fontSize: 9, color: "#f59e0b" }}>{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#52525b" }}>{filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Bookings list */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1fr 140px", alignItems: "center", padding: "9px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
              {["Member", "Type", "Scheduled", "Status", "Actions"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {filteredBookings.length === 0 && (
              <p style={{ fontSize: 13, color: "#52525b", padding: "24px 20px", textAlign: "center" }}>
                No {bookingFilter === "All" ? "" : bookingFilter} bookings yet.
              </p>
            )}

            {filteredBookings.map(b => {
              const { date, time } = fmtDateTime(b.scheduled_at);
              const memberName  = b.profiles?.full_name ?? "Member";
              const memberEmail = b.profiles?.email ?? "";
              const isPending   = b.status === "pending";
              const isPast      = new Date(b.scheduled_at) < now;

              return (
                <div key={b.id} style={{
                  borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                  borderLeft: isPending ? "2px solid rgba(245,158,11,0.5)" : "2px solid transparent",
                  background: isPending ? "rgba(245,158,11,0.02)" : "transparent",
                }}>
                  {/* Main row */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1fr 140px", alignItems: "center", padding: "12px 20px" }}>
                    {/* Member */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,242,255,0.08)", border: "0.5px solid rgba(0,242,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#00f2ff", flexShrink: 0 }}>
                        {memberName[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{memberName}</p>
                        <p style={{ fontSize: 10, color: "#52525b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{memberEmail}</p>
                      </div>
                    </div>

                    {/* Type */}
                    <div>
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase",
                        color: b.session_type === "online" ? "#00f2ff" : "#8b5cf6",
                        background: b.session_type === "online" ? "rgba(0,242,255,0.08)" : "rgba(139,92,246,0.08)",
                        border: `0.5px solid ${b.session_type === "online" ? "rgba(0,242,255,0.2)" : "rgba(139,92,246,0.2)"}`,
                        borderRadius: 20, padding: "3px 8px",
                      }}>
                        {b.session_type === "online" ? "Online" : "In-Person"}
                      </span>
                    </div>

                    {/* Scheduled */}
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: isPast && b.status !== "cancelled" ? "#52525b" : "#fff", margin: 0 }}>{date}</p>
                      <p style={{ fontSize: 11, color: "#71717a", margin: 0 }}>{time}</p>
                    </div>

                    {/* Status */}
                    <StatusBadge status={b.status} />

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 5 }}>
                      {b.status === "pending" && (
                        <>
                          <ActionBtn label="Confirm ✓" color="#3ecf8e" onClick={() => setConfirmTarget(b)} />
                          <ActionBtn label="✕" color="#f87171" onClick={() => setCancelTarget(b)} />
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <ActionBtn label="Cancel" color="#f87171" onClick={() => setCancelTarget(b)} />
                      )}
                      {b.status === "cancelled" && (
                        <span style={{ fontSize: 11, color: "#3f3f46" }}>—</span>
                      )}
                    </div>
                  </div>

                  {/* Sub-row: member notes + zoom link + david note */}
                  {(b.notes || b.zoom_link || b.david_note) && (
                    <div style={{ padding: "0 20px 10px 60px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {b.notes && (
                        <p style={{ fontSize: 11, color: "#52525b", fontStyle: "italic", margin: 0 }}>
                          Member: "{b.notes}"
                        </p>
                      )}
                      {b.zoom_link && (
                        <a href={b.zoom_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#00f2ff", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                          🔗 Zoom link
                        </a>
                      )}
                      {b.david_note && (
                        <p style={{ fontSize: 11, color: "#8b5cf6", margin: 0 }}>
                          Note sent: "{b.david_note}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIDEOS ── */}
      {tab === "Videos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setVideoModal({ open: true, editing: null })} style={{ padding: "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,rgba(0,242,255,0.1),rgba(0,242,255,0.2))", border: "0.5px solid rgba(0,242,255,0.35)", fontSize: 13, fontWeight: 700, color: "#00f2ff", cursor: "pointer" }}>
              + Add Video
            </button>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ ...rowStyle, gridTemplateColumns: "3fr 1fr 1fr 1fr 60px 80px", padding: "8px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
              {["Title", "Category", "Min Plan", "Duration", "Live", "Actions"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {videos.map(v => (
              <div key={v.id} style={{ ...rowStyle, gridTemplateColumns: "3fr 1fr 1fr 1fr 60px 80px", padding: "10px 20px" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: catColor(v.category) }}>{v.category ?? "—"}</span>
                <Badge label={v.min_plan ?? "base"} plan={v.min_plan ?? "base"} />
                <span style={{ fontSize: 11, color: "#71717a" }}>{v.duration ?? "—"}</span>
                <PublishedToggle published={v.published} onChange={() => togglePublished("video", v.id, v.published)} />
                <div style={{ display: "flex", gap: 6 }}>
                  <ActionBtn label="Edit" color="#00f2ff" onClick={() => setVideoModal({ open: true, editing: v })} />
                  <ActionBtn label="Del"  color="#f87171" onClick={() => setDeleteTarget({ type: "video", id: v.id, title: v.title })} />
                </div>
              </div>
            ))}
            {videos.length === 0 && <p style={{ fontSize: 13, color: "#52525b", padding: "20px", textAlign: "center" }}>No videos yet. Add your first one.</p>}
          </div>
        </div>
      )}

      {/* ── RECIPES ── */}
      {tab === "Recipes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setRecipeModal({ open: true, editing: null })} style={{ padding: "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,rgba(139,92,246,0.1),rgba(139,92,246,0.2))", border: "0.5px solid rgba(139,92,246,0.35)", fontSize: 13, fontWeight: 700, color: "#8b5cf6", cursor: "pointer" }}>
              + Add Recipe
            </button>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ ...rowStyle, gridTemplateColumns: "3fr 1fr 1fr 1fr 60px 80px", padding: "8px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
              {["Title", "Category", "Min Plan", "Calories", "Live", "Actions"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {recipes.map(r => (
              <div key={r.id} style={{ ...rowStyle, gridTemplateColumns: "3fr 1fr 1fr 1fr 60px 80px", padding: "10px 20px" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: catColor(r.category) }}>{r.category ?? "—"}</span>
                <Badge label={r.min_plan ?? "base"} plan={r.min_plan ?? "base"} />
                <span style={{ fontSize: 11, color: "#71717a" }}>{r.calories ? `${r.calories} kcal` : "—"}</span>
                <PublishedToggle published={r.published} onChange={() => togglePublished("recipe", r.id, r.published)} />
                <div style={{ display: "flex", gap: 6 }}>
                  <ActionBtn label="Edit" color="#8b5cf6" onClick={() => setRecipeModal({ open: true, editing: r })} />
                  <ActionBtn label="Del"  color="#f87171" onClick={() => setDeleteTarget({ type: "recipe", id: r.id, title: r.title })} />
                </div>
              </div>
            ))}
            {recipes.length === 0 && <p style={{ fontSize: 13, color: "#52525b", padding: "20px", textAlign: "center" }}>No recipes yet. Add your first one.</p>}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {confirmTarget && (
        <ConfirmModal
          booking={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onUpdated={handleBookingUpdated}
        />
      )}
      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onUpdated={handleBookingUpdated}
        />
      )}
      {videoModal.open && (
        <VideoModal
          editing={videoModal.editing}
          onClose={() => setVideoModal({ open: false, editing: null })}
          onSaved={v => {
            setVideos(prev => videoModal.editing
              ? prev.map(x => x.id === v.id ? v : x)
              : [v, ...prev]
            );
            setVideoModal({ open: false, editing: null });
          }}
        />
      )}
      {recipeModal.open && (
        <RecipeModal
          editing={recipeModal.editing}
          onClose={() => setRecipeModal({ open: false, editing: null })}
          onSaved={r => {
            setRecipes(prev => recipeModal.editing
              ? prev.map(x => x.id === r.id ? r : x)
              : [r, ...prev]
            );
            setRecipeModal({ open: false, editing: null });
          }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
