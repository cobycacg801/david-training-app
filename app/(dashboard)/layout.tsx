import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const navItems = [
  { href: "/dashboard",  label: "Home",      icon: "⊞" },
  { href: "/videos",     label: "Videos",    icon: "▶" },
  { href: "/nutrition",  label: "Nutrition", icon: "🥗" },
  { href: "/chat",       label: "Chat",      icon: "💬" },
  { href: "/progress",   label: "Progress",  icon: "📈" },
  { href: "/schedule",   label: "Schedule",  icon: "📅" },
  { href: "/settings",   label: "Profile",   icon: "👤" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auth check — uses cookie-based client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Data reads — use service role to bypass RLS reliably
  const db = createServiceClient();

  const { data: profile } = await db
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { data: membership } = await db
    .from("memberships")
    .select("plan, status")
    .eq("user_id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#050505" }}>

      {/* TOP NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,5,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg, rgba(0,242,255,0.15), rgba(139,92,246,0.2))",
              border: "0.5px solid rgba(0,242,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#00f2ff",
            }}>D</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>David Training</span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: "flex", gap: 4 }}>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className="nav-link">
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 8,
                fontSize: 13, fontWeight: 600, color: "#8b5cf6",
                textDecoration: "none",
                background: "rgba(139,92,246,0.1)",
                border: "0.5px solid rgba(139,92,246,0.2)",
              }}>
                ⚙ Admin
              </Link>
            )}
          </div>

          {/* User + Plan Badge + Sign Out */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {membership?.plan && (
              <div style={{
                background: membership.plan === "elite" ? "rgba(139,92,246,0.15)" : "rgba(0,242,255,0.08)",
                border: `0.5px solid ${membership.plan === "elite" ? "rgba(139,92,246,0.35)" : "rgba(0,242,255,0.25)"}`,
                borderRadius: 20, padding: "3px 10px",
                fontSize: 10, fontWeight: 700, letterSpacing: 1,
                textTransform: "uppercase" as const,
                color: membership.plan === "elite" ? "#8b5cf6" : "#00f2ff",
              }}>
                {membership.plan}
              </div>
            )}
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(0,242,255,0.2), rgba(139,92,246,0.2))",
              border: "0.5px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>
              {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <form action="/api/signout" method="POST">
              <button type="submit" style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "5px 10px",
                fontSize: 11, fontWeight: 600, color: "#71717a",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "32px 24px" }}>
        {children}
      </main>

      {/* FOOTER */}
      <footer style={{
        borderTop: "0.5px solid rgba(255,255,255,0.05)",
        padding: "16px 24px", textAlign: "center",
        fontSize: 11, color: "#3f3f46",
      }}>
        Platform built by{" "}
        <a href="https://makaiusgroup.com" target="_blank" rel="noopener noreferrer"
          style={{ color: "#52525b" }}>
          Makai US Group LLC
        </a>
      </footer>
    </div>
  );
}
