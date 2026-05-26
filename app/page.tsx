import Link from "next/link";
import Image from "next/image";

const G = "#c9a84c";

const plans = [
  {
    name: "Base",
    price: "$19",
    tag: "GET STARTED",
    description: "Full access to the workout library and nutrition recipes.",
    features: ["Full workout video library", "Healthy recipes & meal guides", "Progress photo tracking", "Community feed access"],
    cta: "Join Base",
    href: "/register?plan=base",
    highlight: false,
    vip: false,
  },
  {
    name: "Pro",
    price: "$39",
    tag: "MOST POPULAR",
    description: "Everything in Base plus community chat and full meal plans.",
    features: ["Everything in Base", "Group chat community", "Full meal plan library", "Weekly content drops", "Early access to programs"],
    cta: "Go Pro",
    href: "/register?plan=pro",
    highlight: true,
    vip: false,
  },
  {
    name: "Elite",
    price: "$79",
    tag: "VIP ELITE",
    description: "The full experience. Private coaching with David.",
    features: ["Everything in Pro", "Private 1:1 chat with David", "Monthly coaching session", "Custom workout adjustments", "Priority response"],
    cta: "Go Elite",
    href: "/register?plan=elite",
    highlight: false,
    vip: true,
  },
];

const features = [
  { icon: "▶", title: "Workout Library",    desc: "Hundreds of videos across strength, HIIT, mobility and more — updated weekly." },
  { icon: "🥗", title: "Nutrition Plans",   desc: "Recipes, meal plans and macros designed to fuel your training." },
  { icon: "💬", title: "Community Chat",    desc: "Train alongside David's community. Group motivation, real accountability." },
  { icon: "🔒", title: "Private Coaching",  desc: "Direct 1:1 messages with Coach David. Elite-only personalized guidance." },
  { icon: "📈", title: "Progress Tracking", desc: "Upload your photos and videos. Watch your transformation over time." },
  { icon: "📅", title: "Book Sessions",     desc: "Schedule in-person or online sessions directly through the platform." },
];

export default function LandingPage() {
  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#fff", fontFamily: "Inter, sans-serif" }}
      className="ambient">

      {/* ── NAV ─────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,8,8,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "0.5px solid rgba(201,168,76,0.1)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))",
              border: "0.5px solid rgba(201,168,76,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: G,
            }}>D</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>DAVID TRAINING</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", letterSpacing: 2 }}>ELITE COACHING PLATFORM</div>
            </div>
          </div>

          {/* Nav links + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 500, color: "#71717a", textDecoration: "none", padding: "8px 14px", borderRadius: 8, transition: "all 0.2s" }}>
              Sign In
            </Link>
            <Link href="/register" style={{
              fontSize: 13, fontWeight: 700, color: "#080808", textDecoration: "none",
              padding: "9px 22px", borderRadius: 10,
              background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
              boxShadow: "0 0 20px rgba(201,168,76,0.25)",
            }}>
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────── */}
      <section style={{
        maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
      }} className="fade-up">

        {/* Left — Text */}
        <div>
          <span style={{
            display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: 3,
            color: G, background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.25)",
            borderRadius: 20, padding: "5px 14px", marginBottom: 24,
          }}>
            MIAMI · HOUSTON · ONLINE
          </span>

          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, color: "#fff", marginBottom: 24, letterSpacing: -0.5 }}>
            Train with the{" "}
            <span className="text-gradient">best version</span>
            <br />of yourself.
          </h1>

          <p style={{ fontSize: 17, color: "#a1a1aa", lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            Coach David brings elite fitness, real nutrition, and personal accountability
            to one platform. Built for people who are serious about results.
          </p>

          <div style={{ display: "flex", gap: 14, marginBottom: 52, flexWrap: "wrap" }}>
            <Link href="/register" style={{
              fontSize: 14, fontWeight: 700, color: "#080808", textDecoration: "none",
              padding: "14px 32px", borderRadius: 12,
              background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
              boxShadow: "0 0 32px rgba(201,168,76,0.3)",
            }}>
              Start Your Journey →
            </Link>
            <Link href="#pricing" style={{
              fontSize: 14, fontWeight: 600, color: "#a1a1aa", textDecoration: "none",
              padding: "14px 28px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)",
            }}>
              See Pricing
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 40 }}>
            {[
              { value: "162K+", label: "Followers" },
              { value: "2,700+", label: "Posts" },
              { value: "3 Tiers", label: "Membership" },
              { value: "Houston", label: "& Miami" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-gradient" style={{ fontSize: 22, fontWeight: 900 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#52525b", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — David's Photo */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{
            position: "relative",
            width: "100%", maxWidth: 460,
            borderRadius: 28, overflow: "hidden",
            border: "0.5px solid rgba(201,168,76,0.25)",
            boxShadow: "0 0 100px rgba(201,168,76,0.12), 0 0 40px rgba(201,168,76,0.06), 0 40px 80px rgba(0,0,0,0.7)",
          }}>
            <Image
              src="/david.jpg"
              alt="Coach David — Elite Fitness Coach"
              width={460}
              height={580}
              style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
              priority
            />

            {/* Bottom fade into page background */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 160,
              background: "linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.6) 50%, transparent 100%)",
              pointerEvents: "none",
            }} />

            {/* Name tag overlay */}
            <div style={{
              position: "absolute", bottom: 24, left: 24, right: 24,
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 10, color: G, fontWeight: 800, letterSpacing: 3, marginBottom: 4 }}>
                  COACH DAVID
                </div>
                <div style={{ fontSize: 20, color: "#fff", fontWeight: 900, letterSpacing: -0.5 }}>
                  Pedro David Perez
                </div>
                <div style={{ fontSize: 11, color: "#71717a", fontWeight: 500, marginTop: 2 }}>
                  162K Followers · Houston & Miami
                </div>
              </div>
              <Link href="/register" style={{
                fontSize: 11, fontWeight: 700, color: "#080808", textDecoration: "none",
                padding: "9px 16px", borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
                boxShadow: "0 0 16px rgba(201,168,76,0.3)",
              }}>
                Train Now →
              </Link>
            </div>

            {/* Gold corner accent */}
            <div style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.3)",
              borderRadius: 20, padding: "5px 12px",
              fontSize: 9, fontWeight: 800, color: G, letterSpacing: 2,
            }}>
              ELITE COACH
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section style={{ padding: "80px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 3, color: G,
            background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)",
            borderRadius: 20, padding: "5px 14px", display: "inline-block", marginBottom: 16,
          }}>EVERYTHING YOU NEED</span>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: "#fff" }}>One platform. Total focus.</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(201,168,76,0.1)",
              borderRadius: 18, padding: "24px 22px",
              transition: "all 0.2s",
            }}
              className="glass-gold">
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ────────────────────────────── */}
      <section id="pricing" style={{ padding: "80px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 3, color: G,
            background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)",
            borderRadius: 20, padding: "5px 14px", display: "inline-block", marginBottom: 16,
          }}>MEMBERSHIP PLANS</span>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: "#fff", marginBottom: 10 }}>Choose your level.</h2>
          <p style={{ fontSize: 14, color: "#52525b" }}>Cancel anytime. No contracts.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {plans.map(plan => (
            <div key={plan.name} style={{
              position: "relative",
              background: plan.highlight
                ? "linear-gradient(180deg, rgba(201,168,76,0.07) 0%, rgba(201,168,76,0.03) 100%)"
                : "rgba(255,255,255,0.02)",
              border: `0.5px solid ${plan.highlight ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 20, padding: "30px 26px",
              display: "flex", flexDirection: "column",
              boxShadow: plan.highlight ? "0 0 40px rgba(201,168,76,0.12)" : "none",
            }}>
              {plan.highlight && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#080808",
                  background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
                  padding: "5px 16px", borderRadius: 20,
                }}>MOST POPULAR</div>
              )}

              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: G, marginBottom: 16 }}>
                {plan.tag}
              </div>

              <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 4 }}>
                {plan.price}<span style={{ fontSize: 15, fontWeight: 500, color: "#52525b" }}>/mo</span>
              </div>
              <div className="text-gradient" style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
                {plan.name}
              </div>
              <p style={{ fontSize: 13, color: "#71717a", marginBottom: 24, lineHeight: 1.6 }}>{plan.description}</p>

              <ul style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28, flex: 1 }}>
                {plan.features.map(feat => (
                  <li key={feat} style={{ display: "flex", gap: 10, fontSize: 13, color: "#a1a1aa" }}>
                    <span style={{ color: G, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <Link href={plan.href} style={{
                textAlign: "center", textDecoration: "none",
                padding: "13px 0", borderRadius: 12,
                fontSize: 13, fontWeight: 700,
                ...(plan.highlight
                  ? { background: `linear-gradient(135deg, ${G}, #e8d5a3)`, color: "#080808", boxShadow: "0 0 24px rgba(201,168,76,0.3)" }
                  : { background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.25)", color: G }),
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA bar */}
        <div style={{
          marginTop: 40, padding: "20px 28px", borderRadius: 16,
          background: "rgba(201,168,76,0.04)", border: "0.5px solid rgba(201,168,76,0.12)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa" }}>UNLOCK EXCLUSIVE TRAINING</span>
          </div>
          <Link href="/register" style={{
            textDecoration: "none", padding: "12px 28px", borderRadius: 12,
            fontSize: 13, fontWeight: 700, color: "#080808",
            background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
            boxShadow: "0 0 20px rgba(201,168,76,0.25)",
          }}>
            START YOUR TRANSFORMATION →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)", padding: "28px 32px", marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: G }}>D</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>DAVID TRAINING</div>
              <div style={{ fontSize: 9, color: "#3f3f46", letterSpacing: 1 }}>ELITE COACHING PLATFORM</div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "#3f3f46" }}>
            Platform built by{" "}
            <a href="https://makaiusgroup.com" target="_blank" rel="noopener noreferrer" style={{ color: "#52525b" }}>
              Makai US Group LLC
            </a>
          </p>
          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#52525b" }}>
            <Link href="/login" style={{ color: "#52525b", textDecoration: "none" }}>Sign In</Link>
            <Link href="/register" style={{ color: G, textDecoration: "none", fontWeight: 600 }}>Join Now</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
