import Link from "next/link";

const plans = [
  {
    name: "Base",
    price: "$19",
    period: "/mo",
    tag: "Get Started",
    description: "Full access to the workout library and nutrition recipes.",
    features: [
      "Full workout video library",
      "Healthy recipes & meal guides",
      "Progress tracking",
      "Community feed",
    ],
    cta: "Start Base",
    href: "/register?plan=base",
    accent: "cyan",
    popular: false,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/mo",
    tag: "Most Popular",
    description: "Everything in Base plus community chat and meal plans.",
    features: [
      "Everything in Base",
      "Group chat community",
      "Full meal plans",
      "Weekly new content drops",
      "Early access to programs",
    ],
    cta: "Start Pro",
    href: "/register?plan=pro",
    accent: "violet",
    popular: true,
  },
  {
    name: "Elite",
    price: "$79",
    period: "/mo",
    tag: "All-Access",
    description: "The full experience. Private coaching and monthly session with David.",
    features: [
      "Everything in Pro",
      "Private 1:1 chat with David",
      "Monthly coaching session",
      "Custom workout adjustments",
      "Priority response",
    ],
    cta: "Go Elite",
    href: "/register?plan=elite",
    accent: "cyan",
    popular: false,
  },
];

const features = [
  {
    icon: "▶",
    title: "Workout Library",
    desc: "Hundreds of videos across strength, HIIT, mobility and more — updated weekly.",
    color: "cyan",
  },
  {
    icon: "🥗",
    title: "Nutrition Plans",
    desc: "Recipes, meal plans and macros designed to fuel your training.",
    color: "violet",
  },
  {
    icon: "💬",
    title: "Community Chat",
    desc: "Train alongside David's community. Group motivation, real accountability.",
    color: "cyan",
  },
  {
    icon: "🔒",
    title: "Private Coaching",
    desc: "Direct 1:1 messages with Coach David. Elite-only personalized guidance.",
    color: "violet",
  },
  {
    icon: "📈",
    title: "Progress Tracking",
    desc: "Upload your photos and videos. Watch your transformation over time.",
    color: "cyan",
  },
  {
    icon: "📅",
    title: "Book Sessions",
    desc: "Schedule in-person or online sessions directly through the platform.",
    color: "violet",
  },
];

export default function LandingPage() {
  return (
    <div className="relative z-10 flex flex-col min-h-screen">

      {/* NAV */}
      <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(0,242,255,0.15), rgba(139,92,246,0.2))",
                border: "0.5px solid rgba(0,242,255,0.3)",
                color: "#00f2ff",
              }}
            >
              D
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-wide">David Training</div>
              <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#a1a1aa" }}>
                Elite Coaching
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:text-white"
              style={{ color: "#a1a1aa" }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #00f2ff, #8b5cf6)",
                color: "#050505",
              }}
            >
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <div className="fade-up">
          <span
            className="inline-block text-xs font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-6"
            style={{
              background: "rgba(0,242,255,0.08)",
              border: "0.5px solid rgba(0,242,255,0.3)",
              color: "#00f2ff",
            }}
          >
            Houston · Miami · Online
          </span>
        </div>

        <h1
          className="fade-up delay-1 text-5xl md:text-7xl font-black tracking-tight leading-none mb-6"
          style={{ maxWidth: "800px" }}
        >
          Train with the{" "}
          <span className="text-gradient">best version</span>{" "}
          of yourself.
        </h1>

        <p
          className="fade-up delay-2 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#a1a1aa" }}
        >
          Coach David brings elite fitness, real nutrition, and personal accountability
          to one platform. Built for people who are serious about results.
        </p>

        <div className="fade-up delay-3 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl text-base font-bold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00f2ff, #8b5cf6)",
              color: "#050505",
              boxShadow: "0 0 32px rgba(0,242,255,0.2)",
            }}
          >
            Start Your Journey →
          </Link>
          <Link
            href="#pricing"
            className="px-8 py-4 rounded-xl text-base font-semibold glass transition-all hover:opacity-90"
            style={{ color: "#a1a1aa" }}
          >
            See Pricing
          </Link>
        </div>

        {/* Stats */}
        <div className="fade-up delay-4 flex flex-wrap justify-center gap-8 mt-16">
          {[
            { value: "162K+", label: "Followers" },
            { value: "2,700+", label: "Posts" },
            { value: "3 Tiers", label: "Membership" },
            { value: "Houston", label: "& Miami" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-gradient">{s.value}</div>
              <div className="text-xs font-medium tracking-wider uppercase mt-1" style={{ color: "#a1a1aa" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <div
            className="inline-block text-xs font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(139,92,246,0.08)", border: "0.5px solid rgba(139,92,246,0.25)", color: "#8b5cf6" }}
          >
            Everything you need
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white">One platform. Total focus.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`glass rounded-2xl p-6 transition-all hover:-translate-y-1 ${f.color === "cyan" ? "glow-cyan" : "glow-violet"}`}
              style={{ borderColor: f.color === "cyan" ? "rgba(0,242,255,0.12)" : "rgba(139,92,246,0.15)" }}
            >
              <div
                className="text-2xl mb-4 w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: f.color === "cyan" ? "rgba(0,242,255,0.08)" : "rgba(139,92,246,0.08)",
                  border: `0.5px solid ${f.color === "cyan" ? "rgba(0,242,255,0.2)" : "rgba(139,92,246,0.2)"}`,
                }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <div
            className="inline-block text-xs font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(0,242,255,0.08)", border: "0.5px solid rgba(0,242,255,0.25)", color: "#00f2ff" }}
          >
            Membership Plans
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Choose your level.</h2>
          <p className="text-base" style={{ color: "#a1a1aa" }}>Cancel anytime. No contracts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative glass rounded-2xl p-7 flex flex-col transition-all hover:-translate-y-1 ${
                plan.popular ? "glow-violet" : "glow-cyan"
              }`}
              style={{
                borderColor: plan.popular ? "rgba(139,92,246,0.3)" : "rgba(0,242,255,0.15)",
                background: plan.popular ? "rgba(139,92,246,0.06)" : undefined,
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold tracking-wider uppercase px-4 py-1 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #00f2ff)",
                    color: "#050505",
                  }}
                >
                  Most Popular
                </div>
              )}

              <div
                className="text-xs font-bold tracking-widest uppercase mb-3"
                style={{ color: plan.popular ? "#8b5cf6" : "#00f2ff" }}
              >
                {plan.tag}
              </div>

              <div className="text-3xl font-black text-white mb-1">
                {plan.price}
                <span className="text-lg font-medium" style={{ color: "#a1a1aa" }}>{plan.period}</span>
              </div>
              <div className="text-2xl font-black mb-3" style={{ color: plan.popular ? "#8b5cf6" : "#00f2ff" }}>
                {plan.name}
              </div>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "#a1a1aa" }}>{plan.description}</p>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm" style={{ color: "#e4e4e7" }}>
                    <span style={{ color: plan.popular ? "#8b5cf6" : "#00f2ff", flexShrink: 0 }}>✓</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90 active:scale-95"
                style={
                  plan.popular
                    ? { background: "linear-gradient(135deg, #8b5cf6, #00f2ff)", color: "#050505" }
                    : { background: "rgba(0,242,255,0.1)", border: "0.5px solid rgba(0,242,255,0.3)", color: "#00f2ff" }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto px-6 py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(0,242,255,0.1)", border: "0.5px solid rgba(0,242,255,0.25)", color: "#00f2ff" }}
            >
              D
            </div>
            <span className="text-sm font-semibold text-white">David Training</span>
          </div>
          <p className="text-xs" style={{ color: "#3f3f46" }}>
            Platform built by{" "}
            <a
              href="https://makaiusgroup.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
              style={{ color: "#52525b" }}
            >
              Makai US Group LLC
            </a>
          </p>
          <div className="flex gap-5 text-xs" style={{ color: "#52525b" }}>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
