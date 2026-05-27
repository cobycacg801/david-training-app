"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { PLAN_COLOR } from "@/lib/planUtils";
import { compressImage } from "@/lib/compressImage";

const G = "#c9a84c";

const PLAN_LABEL: Record<string, string> = {
  base:  "Base Plan",
  pro:   "Pro Plan",
  elite: "Elite Plan",
};
const PLAN_PRICE: Record<string, string> = {
  base: "$19/mo", pro: "$39/mo", elite: "$79/mo",
};

type Props = {
  userId:          string;
  fullName:        string;
  email:           string;
  phone:           string;
  avatarUrl:       string;
  fitnessGoal:     string;
  height:          string;
  weight:          string;
  notifySms:       boolean;
  notifyEmail:     boolean;
  plan:            string;
  membershipStatus: string;
  hasStripe:       boolean;
  nextChargeDate:  string | null;
};

type SaveState = "idle" | "saving" | "success" | "error";

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "0.5px solid rgba(255,255,255,0.07)",
      borderRadius: 20, padding: 28,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#52525b", letterSpacing: 2, textTransform: "uppercase" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function SaveBtn({ state, onClick, label = "Save Changes" }: { state: SaveState; onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} disabled={state === "saving"} style={{
      padding: "12px 24px", borderRadius: 12, cursor: state === "saving" ? "not-allowed" : "pointer",
      background: state === "saving" ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg, ${G}, #e8d5a3)`,
      border: state === "saving" ? "0.5px solid rgba(255,255,255,0.08)" : "none",
      fontSize: 13, fontWeight: 800, color: state === "saving" ? "#52525b" : "#080808",
      transition: "all 0.2s", letterSpacing: 0.3,
      boxShadow: state === "saving" ? "none" : "0 0 20px rgba(201,168,76,0.2)",
    }}>
      {state === "saving" ? "Saving…" : state === "success" ? "✓ Saved!" : label}
    </button>
  );
}

function StatusMsg({ state, errMsg }: { state: SaveState; errMsg: string }) {
  if (state === "success") return (
    <p style={{ fontSize: 12, color: "#3ecf8e", marginTop: 4 }}>Changes saved successfully.</p>
  );
  if (state === "error") return (
    <p style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>{errMsg}</p>
  );
  return null;
}

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

export default function SettingsPage({
  fullName: initName, email, phone: initPhone,
  avatarUrl: initAvatar, fitnessGoal: initGoal,
  height: initHeight, weight: initWeight,
  notifySms: initSms, notifyEmail: initEmail,
  plan, membershipStatus, hasStripe, nextChargeDate,
}: Props) {

  // ── Profile section ───────────────────────────────
  const [name,    setName]    = useState(initName);
  const [phone,   setPhone]   = useState(initPhone);
  const [avatar,  setAvatar]  = useState(initAvatar);
  const [profileState,  setProfileState]  = useState<SaveState>("idle");
  const [profileErr,    setProfileErr]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Fitness section ───────────────────────────────
  const [goal,   setGoal]   = useState(initGoal);
  const [height, setHeight] = useState(initHeight);
  const [weight, setWeight] = useState(initWeight);
  const [fitnessState, setFitnessState] = useState<SaveState>("idle");
  const [fitnessErr,   setFitnessErr]   = useState("");

  // ── Notifications ─────────────────────────────────
  const [sms,   setSms]   = useState(initSms);
  const [emailN, setEmailN] = useState(initEmail);
  const [notifState, setNotifState] = useState<SaveState>("idle");
  const [notifErr,   setNotifErr]   = useState("");

  // ── Password section ──────────────────────────────
  const [newPass,   setNewPass]   = useState("");
  const [confPass,  setConfPass]  = useState("");
  const [passState, setPassState] = useState<SaveState>("idle");
  const [passErr,   setPassErr]   = useState("");

  // ── Billing ───────────────────────────────────────
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingErr,     setBillingErr]     = useState("");

  // ── Helpers ───────────────────────────────────────
  async function patchProfile(body: object, setState: (s: SaveState) => void, setErr: (s: string) => void) {
    setState("saving");
    setErr("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setState("success");
      setTimeout(() => setState("idle"), 3500);
    } else {
      setState("error");
      setErr(data.error ?? "Something went wrong.");
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const compressed = await compressImage(file, 400, 0.85);
    const fd = new FormData();
    fd.append("avatar", compressed);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const data = await res.json();
    setAvatarUploading(false);
    if (res.ok) setAvatar(data.avatarUrl);
    else setProfileErr(data.error ?? "Upload failed.");
  }

  async function handleSaveProfile() {
    await patchProfile(
      { fullName: name.trim() || undefined, phone: phone.trim() || null },
      setProfileState, setProfileErr
    );
  }

  async function handleSaveFitness() {
    await patchProfile(
      { fitnessGoal: goal || null, height: height.trim() || null, weight: weight.trim() || null },
      setFitnessState, setFitnessErr
    );
  }

  async function handleSaveNotifications() {
    await patchProfile(
      { notifySms: sms, notifyEmail: emailN },
      setNotifState, setNotifErr
    );
  }

  async function handleChangePassword() {
    setPassErr("");
    if (newPass.length < 8) { setPassErr("Password must be at least 8 characters."); return; }
    if (newPass !== confPass) { setPassErr("Passwords do not match."); return; }
    setPassState("saving");
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPass }),
    });
    const data = await res.json();
    if (res.ok) {
      setPassState("success");
      setNewPass(""); setConfPass("");
      setTimeout(() => setPassState("idle"), 3500);
    } else {
      setPassState("error");
      setPassErr(data.error ?? "Something went wrong.");
    }
  }

  async function handleBillingPortal() {
    setBillingLoading(true);
    setBillingErr("");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    setBillingLoading(false);
    if (res.ok && data.url) {
      window.open(data.url, "_blank");
    } else {
      setBillingErr(data.error ?? "Could not open billing portal.");
    }
  }

  const initials = (name?.[0] ?? email?.[0] ?? "?").toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          Profile <span style={{ background: `linear-gradient(135deg, ${G}, #e8d5a3)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Settings</span>
        </h1>
        <p style={{ fontSize: 13, color: "#71717a" }}>Manage your account, security, and billing preferences</p>
      </div>

      {/* ── 1. PROFILE ──────────────────────────────── */}
      <Section title="Profile" icon="👤">

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.06))`,
              border: "0.5px solid rgba(201,168,76,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 900, color: G,
              overflow: "hidden",
            }}>
              {avatar ? (
                <Image src={avatar} alt="Avatar" width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
              ) : initials}
            </div>
            {avatarUploading && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 10, color: G, fontWeight: 700,
              }}>...</div>
            )}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{name || "—"}</p>
            <p style={{ fontSize: 12, color: "#52525b", marginBottom: 10 }}>{email}</p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              style={{
                fontSize: 11, fontWeight: 700, color: G, cursor: "pointer",
                background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)",
                borderRadius: 8, padding: "6px 14px", transition: "all 0.2s",
              }}
            >
              {avatarUploading ? "Uploading…" : "Change Photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleAvatarChange} />
            <p style={{ fontSize: 10, color: "#3f3f46", marginTop: 6 }}>JPG, PNG or WebP · max 5 MB</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email <span style={{ color: "#3f3f46", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(read-only)</span></label>
            <input type="email" value={email} readOnly style={{ ...inputStyle, color: "#52525b", cursor: "not-allowed" }} />
          </div>
          <div>
            <label style={labelStyle}>Phone <span style={{ color: "#3ecf8e", fontWeight: 700 }}>— SMS reminders</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 713 555 0123" style={inputStyle} />
            <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 6 }}>Include country code · US: +1 · Mexico: +52 · Venezuela: +58</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, flexWrap: "wrap", gap: 10 }}>
          <StatusMsg state={profileState} errMsg={profileErr} />
          <SaveBtn state={profileState} onClick={handleSaveProfile} />
        </div>
      </Section>

      {/* ── 2. FITNESS PROFILE ──────────────────────── */}
      <Section title="Fitness Profile" icon="💪">
        <p style={{ fontSize: 12, color: "#71717a", marginBottom: 20 }}>
          Coach David uses this to personalize your training plan.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={labelStyle}>My Goal</label>
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="" style={{ background: "#0c0c0e" }}>Select a goal…</option>
              <option value="lose_fat"       style={{ background: "#0c0c0e" }}>Lose Fat</option>
              <option value="build_muscle"   style={{ background: "#0c0c0e" }}>Build Muscle</option>
              <option value="performance"    style={{ background: "#0c0c0e" }}>Improve Performance</option>
              <option value="general"        style={{ background: "#0c0c0e" }}>General Fitness</option>
              <option value="body_recomp"    style={{ background: "#0c0c0e" }}>Body Recomposition</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Height</label>
              <input type="text" value={height} onChange={e => setHeight(e.target.value)} placeholder='e.g. 5&apos;10" or 178cm' style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Weight</label>
              <input type="text" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 185 lbs or 84 kg" style={inputStyle} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, flexWrap: "wrap", gap: 10 }}>
          <StatusMsg state={fitnessState} errMsg={fitnessErr} />
          <SaveBtn state={fitnessState} onClick={handleSaveFitness} />
        </div>
      </Section>

      {/* ── 3. NOTIFICATIONS ────────────────────────── */}
      <Section title="Notifications" icon="🔔">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "SMS notifications", sub: "Session reminders, confirmations, and updates via text", val: sms, set: setSms },
            { label: "Email notifications", sub: "Session details, Zoom links, and booking confirmations", val: emailN, set: setEmailN },
          ].map(({ label, sub, val, set }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)",
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 11, color: "#71717a" }}>{sub}</p>
              </div>
              <button
                onClick={() => set(!val)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                  background: val ? G : "rgba(255,255,255,0.1)",
                  position: "relative", transition: "background 0.2s", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                  background: "#fff", transition: "left 0.2s",
                  left: val ? 23 : 3,
                }} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, flexWrap: "wrap", gap: 10 }}>
          <StatusMsg state={notifState} errMsg={notifErr} />
          <SaveBtn state={notifState} onClick={handleSaveNotifications} />
        </div>
      </Section>

      {/* ── 4. SECURITY ─────────────────────────────── */}
      <Section title="Change Password" icon="🔒">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
              placeholder="At least 8 characters"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "rgba(201,168,76,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password" value={confPass} onChange={e => setConfPass(e.target.value)}
              placeholder="Repeat your new password"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "rgba(201,168,76,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
        </div>
        {passErr && <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>{passErr}</p>}
        {passState === "success" && <p style={{ fontSize: 12, color: "#3ecf8e", marginTop: 10 }}>Password updated successfully.</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <SaveBtn state={passState} onClick={handleChangePassword} label="Update Password" />
        </div>
      </Section>

      {/* ── 5. BILLING ──────────────────────────────── */}
      <Section title="Billing & Plan" icon="💳">
        {/* Plan summary */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", borderRadius: 14,
          background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.15)",
          marginBottom: 16, flexWrap: "wrap", gap: 10,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Current Plan</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: PLAN_COLOR[plan] ?? G }}>
              {PLAN_LABEL[plan] ?? plan}
              <span style={{ fontSize: 12, fontWeight: 500, color: "#71717a", marginLeft: 8 }}>{PLAN_PRICE[plan]}</span>
            </p>
            <p style={{ fontSize: 11, marginTop: 4 }}>
              Status:{" "}
              <span style={{ color: membershipStatus === "active" ? "#3ecf8e" : "#f87171", fontWeight: 700 }}>
                {membershipStatus === "active" ? "Active" : membershipStatus}
              </span>
            </p>
          </div>
          {plan !== "elite" && (
            <a href="/#pricing" style={{
              fontSize: 12, fontWeight: 700, color: "#080808", textDecoration: "none",
              padding: "9px 20px", borderRadius: 10,
              background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
              boxShadow: "0 0 16px rgba(201,168,76,0.2)",
            }}>Upgrade Plan →</a>
          )}
        </div>

        {/* Next charge */}
        {nextChargeDate && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)",
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#71717a" }}>Next billing date</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {new Date(nextChargeDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* Stripe portal */}
        {hasStripe ? (
          <>
            <button
              onClick={handleBillingPortal}
              disabled={billingLoading}
              style={{
                width: "100%", padding: "12px", borderRadius: 12, cursor: billingLoading ? "not-allowed" : "pointer",
                background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                fontSize: 13, fontWeight: 700, color: billingLoading ? "#52525b" : "#fff",
                transition: "all 0.2s",
              }}
            >
              {billingLoading ? "Opening…" : "Manage Billing →"}
            </button>
            {billingErr && <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>{billingErr}</p>}
            <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 10, lineHeight: 1.6 }}>
              Opens the Stripe billing portal where you can update your payment method, view invoices, or cancel your subscription.
            </p>
          </>
        ) : (
          <p style={{ fontSize: 12, color: "#52525b" }}>
            No billing account linked yet. This happens automatically when you subscribe through the platform.
          </p>
        )}
      </Section>

    </div>
  );
}
