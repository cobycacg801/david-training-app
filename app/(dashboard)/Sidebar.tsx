"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const G = "#c9a84c";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: "⊞",  elite: false },
  { href: "/videos",     label: "Workouts",   icon: "▶",  elite: false },
  { href: "/nutrition",  label: "Nutrition",  icon: "🥗", elite: false },
  { href: "/progress",   label: "Progress",   icon: "📈", elite: false },
  { href: "/chat",       label: "Community",  icon: "💬", elite: false },
  { href: "/messages",   label: "Messages",   icon: "✉",  elite: true  },
  { href: "/schedule",   label: "Schedule",   icon: "📅", elite: false },
  { href: "/settings",   label: "Profile",    icon: "👤", elite: false },
];

const PLAN_COLOR: Record<string, string> = {
  base: "#a1a1aa", pro: G, elite: "#e8d5a3",
};
const PLAN_LABEL: Record<string, string> = {
  base: "Base", pro: "Pro", elite: "Elite",
};

type Props = {
  userName: string;
  userInitial: string;
  plan: string;
  isAdmin: boolean;
};

export default function Sidebar({ userName, userInitial, plan, isAdmin }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sidebar-fixed" style={{
      background: "#0c0c0e",
      borderRight: "0.5px solid rgba(201,168,76,0.1)",
      display: "flex", flexDirection: "column",
    }}>

      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg,rgba(201,168,76,0.18),rgba(201,168,76,0.06))",
            border: "0.5px solid rgba(201,168,76,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: G, flexShrink: 0,
          }}>D</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 1, whiteSpace: "nowrap" }}>DAVID TRAINING</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: "#3f3f46", letterSpacing: 1.5 }}>ELITE COACHING</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${isActive(item.href) ? " active" : ""}`}
          >
            <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.elite && plan !== "elite" && (
              <span style={{
                fontSize: 8, fontWeight: 800, color: G, letterSpacing: 0.8,
                background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)",
                padding: "2px 5px", borderRadius: 4, textTransform: "uppercase",
              }}>Elite</span>
            )}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div style={{ margin: "12px 16px 8px", borderTop: "0.5px solid rgba(255,255,255,0.05)" }} />
            <Link
              href="/admin"
              className={`nav-link${isActive("/admin") ? " active" : ""}`}
              style={{ color: isActive("/admin") ? G : "#52525b" }}
            >
              <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>⚙</span>
              <span>Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom: Plan badge + user + sign out */}
      <div style={{ padding: "16px 12px", borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>

        {/* Plan badge */}
        <div style={{
          marginBottom: 12, padding: "8px 12px", borderRadius: 10,
          background: "rgba(201,168,76,0.05)", border: "0.5px solid rgba(201,168,76,0.12)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Current Plan</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: PLAN_COLOR[plan] ?? G }}>
              {PLAN_LABEL[plan] ?? plan}
            </div>
          </div>
          {plan !== "elite" && (
            <Link href="/#pricing" style={{
              fontSize: 9, fontWeight: 700, color: G, textDecoration: "none",
              background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.2)",
              padding: "3px 8px", borderRadius: 6,
            }}>Upgrade</Link>
          )}
        </div>

        {/* User row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "0 4px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.08))",
            border: "0.5px solid rgba(201,168,76,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: G,
          }}>
            {userInitial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </div>
            {isAdmin && (
              <div style={{ fontSize: 9, fontWeight: 800, color: "#8b5cf6", letterSpacing: 1 }}>ADMIN</div>
            )}
          </div>
        </div>

        {/* Sign out */}
        <form action="/api/signout" method="POST">
          <button type="submit" style={{
            width: "100%", padding: "8px 0", borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)",
            fontSize: 11, fontWeight: 600, color: "#52525b", transition: "all 0.2s",
          }}>
            Sign Out
          </button>
        </form>

        {/* Makai branding */}
        <a
          href="https://makaiusgroup.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            marginTop: 12, padding: "7px 0", borderRadius: 7, textDecoration: "none",
            background: "rgba(62,207,142,0.04)",
            border: "0.5px solid rgba(62,207,142,0.15)",
            transition: "border-color 0.2s",
          }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: "linear-gradient(135deg,#1a3a2a,#0d2018)",
            border: "0.5px solid rgba(62,207,142,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 7, fontWeight: 900, color: "#3ecf8e", flexShrink: 0,
          }}>M</div>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#3ecf8e", letterSpacing: 0.5 }}>
            Makai US Group LLC
          </span>
        </a>
      </div>
    </aside>
  );
}
