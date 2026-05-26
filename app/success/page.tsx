import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; user_id?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const { session_id, user_id, plan } = params;

  if (session_id && user_id && plan) {
    const db = createServiceClient();

    // ── Safety net: guarantee profile exists ──────────────────
    // The signup trigger should have created this, but if it failed
    // for any reason (race condition, RLS edge case, etc.) we create
    // it here using the auth record as the source of truth.
    try {
      const { data: { user: authUser } } = await db.auth.admin.getUserById(user_id);

      if (authUser) {
        const email    = authUser.email ?? "";
        const fullName =
          authUser.user_metadata?.full_name ??
          authUser.user_metadata?.name ??
          email.split("@")[0]; // last-resort fallback: use email prefix

        await db.from("profiles").upsert(
          {
            id:        user_id,
            email,
            full_name: fullName,
            role:      "member",
          },
          { onConflict: "id" }
        );
      }
    } catch {
      // Non-fatal — profile may already exist, continue to membership upsert
    }

    // ── Guarantee membership exists ───────────────────────────
    // This is the primary purpose of the success page.
    // onConflict: update so plan upgrades also work correctly.
    await db.from("memberships").upsert(
      {
        user_id,
        plan,
        status: "active",
        stripe_price_id: plan,
      },
      { onConflict: "user_id" }
    );
  }

  const planLabels: Record<string, string> = {
    base: "Base", pro: "Pro", elite: "Elite",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="text-center max-w-md">

        {/* Success icon */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px",
          background: "rgba(0,242,255,0.08)", border: "0.5px solid rgba(0,242,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, boxShadow: "0 0 40px rgba(0,242,255,0.15)",
        }}>
          ✓
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 12 }}>
          Welcome to the{" "}
          <span style={{
            background: "linear-gradient(135deg, #00f2ff, #8b5cf6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {planLabels[plan || ""] || ""} Plan
          </span>
        </h1>

        <p style={{ fontSize: 16, color: "#a1a1aa", marginBottom: 32, lineHeight: 1.6 }}>
          Your account is active. Time to start training with Coach David.
        </p>

        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #00f2ff, #8b5cf6)",
            color: "#050505", borderRadius: 12,
            padding: "14px 32px", fontSize: 15, fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 0 32px rgba(0,242,255,0.2)",
          }}
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}
