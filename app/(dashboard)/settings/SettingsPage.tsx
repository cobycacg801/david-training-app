"use client";
import { useState } from "react";
import { PLAN_COLOR } from "@/lib/planUtils";

type Props = {
  userId:   string;
  fullName: string;
  email:    string;
  phone:    string;
  plan:     string;
};

const PLAN_BG: Record<string, string> = {
  base: "rgba(161,161,170,0.08)", pro: "rgba(0,242,255,0.08)", elite: "rgba(139,92,246,0.1)",
};
const PLAN_BORDER: Record<string, string> = {
  base: "rgba(161,161,170,0.2)", pro: "rgba(0,242,255,0.2)", elite: "rgba(139,92,246,0.25)",
};
const PLAN_LABEL: Record<string, string> = {
  base: "Base Plan — $19/mo",
  pro:  "Pro Plan — $39/mo",
  elite: "Elite Plan — $79/mo",
};

export default function SettingsPage({ userId, fullName, email, phone: initialPhone, plan }: Props) {
  const [name,    setName]    = useState(fullName);
  const [phone,   setPhone]   = useState(initialPhone);
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState<"idle" | "success" | "error">("idle");
  const [errMsg,  setErrMsg]  = useState("");

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    setErrMsg("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: name.trim() || undefined,
        phone:    phone.trim() || null,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      setStatus("error");
      setErrMsg(data.error ?? "Something went wrong.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, color: "#fff",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: "#52525b",
    letterSpacing: 1, textTransform: "uppercase",
    display: "block", marginBottom: 8,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          Profile{" "}
          <span style={{ background: "linear-gradient(135deg,#00f2ff,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Settings</span>
        </h1>
        <p style={{ fontSize: 13, color: "#a1a1aa" }}>Update your name and phone number for SMS notifications</p>
      </div>

      {/* Plan card (read-only) */}
      <div style={{ background: PLAN_BG[plan] ?? "rgba(255,255,255,0.02)", border: `0.5px solid ${PLAN_BORDER[plan] ?? "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Current Plan</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: PLAN_COLOR[plan] ?? "#a1a1aa" }}>{PLAN_LABEL[plan] ?? plan}</p>
        </div>
        <a href="/#pricing" style={{ padding: "7px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", fontSize: 12, fontWeight: 600, color: "#71717a", textDecoration: "none" }}>
          Upgrade →
        </a>
      </div>

      {/* Profile form card */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 28 }}>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,rgba(0,242,255,0.2),rgba(139,92,246,0.2))", border: "0.5px solid rgba(0,242,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {(name?.[0] ?? email?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{name || "—"}</p>
            <p style={{ fontSize: 12, color: "#52525b" }}>{email}</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Full name */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              style={inputStyle}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label style={labelStyle}>Email <span style={{ color: "#3f3f46", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(cannot be changed here)</span></label>
            <input
              type="email"
              value={email}
              readOnly
              style={{ ...inputStyle, color: "#52525b", cursor: "not-allowed" }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>
              Phone Number{" "}
              <span style={{ color: "#3ecf8e", fontWeight: 700 }}>— for SMS reminders</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 713 555 0123"
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: "#52525b", marginTop: 8 }}>
              Include country code — US: +1, Mexico: +52, Colombia: +57, Venezuela: +58.
              Example: <span style={{ color: "#71717a" }}>+17135550123</span>
            </p>
            <div style={{ marginTop: 10, background: "rgba(0,242,255,0.04)", border: "0.5px solid rgba(0,242,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ fontSize: 11, color: "#a1a1aa", lineHeight: 1.6 }}>
                📱 Once saved, you'll receive <strong style={{ color: "#00f2ff" }}>SMS text messages</strong> for:
              </p>
              <ul style={{ fontSize: 11, color: "#71717a", margin: "6px 0 0 16px", lineHeight: 1.8 }}>
                <li>Session confirmations (with Zoom link if online)</li>
                <li>24-hour reminders before your session</li>
                <li>Cancellation notices from Coach David</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status messages */}
        {status === "success" && (
          <div style={{ marginTop: 18, background: "rgba(62,207,142,0.08)", border: "0.5px solid rgba(62,207,142,0.25)", borderRadius: 10, padding: "11px 16px", fontSize: 13, color: "#3ecf8e" }}>
            ✓ Profile updated successfully!
          </div>
        )}
        {status === "error" && (
          <div style={{ marginTop: 18, background: "rgba(248,113,113,0.08)", border: "0.5px solid rgba(248,113,113,0.25)", borderRadius: 10, padding: "11px 16px", fontSize: 13, color: "#f87171" }}>
            ⚠ {errMsg}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", marginTop: 22, padding: "13px 0",
            borderRadius: 12,
            background: saving
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(135deg,rgba(0,242,255,0.12),rgba(0,242,255,0.22))",
            border: `0.5px solid ${saving ? "rgba(255,255,255,0.08)" : "rgba(0,242,255,0.35)"}`,
            fontSize: 14, fontWeight: 700,
            color: saving ? "#52525b" : "#00f2ff",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* SMS info note */}
      <div style={{ background: "rgba(255,255,255,0.01)", border: "0.5px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 18px" }}>
        <p style={{ fontSize: 11, color: "#3f3f46", lineHeight: 1.7 }}>
          📧 Email notifications are always sent regardless of whether you have a phone number saved.
          SMS is an additional channel — standard messaging rates from your carrier may apply.
          To stop SMS, simply remove your phone number and save.
        </p>
      </div>
    </div>
  );
}
