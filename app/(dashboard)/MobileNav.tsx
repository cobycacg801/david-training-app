"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const G = "#c9a84c";

const tabs = [
  { href: "/dashboard", label: "Home",      icon: "⊞" },
  { href: "/videos",    label: "Workouts",  icon: "▶" },
  { href: "/nutrition", label: "Nutrition", icon: "🥗" },
  { href: "/chat",      label: "Community", icon: "💬" },
  { href: "/settings",  label: "Profile",   icon: "👤" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="mobile-nav">
      {tabs.map(tab => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, padding: "6px 14px", textDecoration: "none",
              position: "relative", flex: 1,
            }}
          >
            <span style={{
              fontSize: 20, lineHeight: 1,
              filter: active ? "none" : "grayscale(0.6) opacity(0.5)",
              transition: "filter 0.15s",
            }}>{tab.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: active ? 700 : 500,
              color: active ? G : "#52525b",
              letterSpacing: 0.3, transition: "color 0.15s",
            }}>
              {tab.label}
            </span>
            {active && (
              <div style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: 24, height: 2, borderRadius: 2, background: G,
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
