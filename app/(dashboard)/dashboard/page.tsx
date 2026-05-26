import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

const quickLinks = [
  { href: "/videos",    label: "Workout Videos",  icon: "▶", desc: "Start training",     color: "#00f2ff", bg: "rgba(0,242,255,0.06)",    border: "rgba(0,242,255,0.15)"    },
  { href: "/nutrition", label: "Nutrition",        icon: "🥗", desc: "Recipes & meal plans", color: "#8b5cf6", bg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.18)"  },
  { href: "/chat",      label: "Community Chat",   icon: "💬", desc: "Talk to the group",  color: "#00f2ff", bg: "rgba(0,242,255,0.06)",    border: "rgba(0,242,255,0.15)"    },
  { href: "/progress",  label: "My Progress",      icon: "📈", desc: "Upload & track",     color: "#8b5cf6", bg: "rgba(139,92,246,0.06)",   border: "rgba(139,92,246,0.18)"   },
  { href: "/schedule",  label: "Book a Session",   icon: "📅", desc: "In-person or online", color: "#00f2ff", bg: "rgba(0,242,255,0.06)",   border: "rgba(0,242,255,0.15)"    },
];

export default async function DashboardPage() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Data reads — service role bypasses RLS
  const db = createServiceClient();

  const { data: profile } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: membership } = await db
    .from("memberships")
    .select("plan, status, current_period_end")
    .eq("user_id", user!.id)
    .single();

  const { data: videos } = await db
    .from("videos")
    .select("id, title, duration, category, calories")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const planLabel: Record<string, string> = { base: "Base", pro: "Pro", elite: "Elite" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* GREETING */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 6 }}>
          Welcome back, <span style={{
            background: "linear-gradient(135deg, #00f2ff, #8b5cf6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{firstName}</span> 👋
        </h1>
        <p style={{ fontSize: 14, color: "#a1a1aa" }}>
          Ready to train? Your {planLabel[membership?.plan || "base"] || "Base"} membership is active.
        </p>
      </div>

      {/* PLAN BANNER */}
      {membership && (
        <div style={{
          background: membership.plan === "elite" ? "rgba(139,92,246,0.08)" : "rgba(0,242,255,0.05)",
          border: `0.5px solid ${membership.plan === "elite" ? "rgba(139,92,246,0.2)" : "rgba(0,242,255,0.15)"}`,
          borderRadius: 16, padding: "18px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: membership.plan === "elite" ? "rgba(139,92,246,0.2)" : "rgba(0,242,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>⭐</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {planLabel[membership.plan]} Plan
              </div>
              <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>
                Status: <span style={{ color: "#3ecf8e" }}>{membership.status}</span>
              </div>
            </div>
          </div>
          <Link href="/schedule" style={{
            background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600,
            color: "#fff", textDecoration: "none",
          }}>
            Book a session →
          </Link>
        </div>
      )}

      {/* QUICK LINKS */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
          Quick Access
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              background: link.bg, border: `0.5px solid ${link.border}`,
              borderRadius: 14, padding: "18px", textDecoration: "none",
              display: "flex", flexDirection: "column", gap: 10,
              transition: "all 0.2s",
            }}
            >
              <div style={{ fontSize: 22 }}>{link.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{link.label}</div>
                <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* RECENT VIDEOS */}
      {videos && videos.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Latest Workouts
            </p>
            <Link href="/videos" style={{ fontSize: 12, color: "#00f2ff", textDecoration: "none" }}>
              See all →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {videos.map(video => (
              <div key={video.id} style={{
                background: "rgba(0,242,255,0.03)", border: "0.5px solid rgba(0,242,255,0.1)",
                borderRadius: 12, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 48, height: 34, borderRadius: 8,
                  background: "rgba(0,242,255,0.08)", border: "0.5px solid rgba(0,242,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "rgba(0,242,255,0.8)", flexShrink: 0,
                }}>▶</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {video.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>
                    {video.duration && `${video.duration} · `}{video.calories && `${video.calories} kcal`}
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#52525b" }}>
                  {video.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
