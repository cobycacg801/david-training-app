"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const plans = [
  { id: "base",  label: "Base",  price: "$19/mo", color: "#00f2ff",  border: "rgba(0,242,255,0.3)"   },
  { id: "pro",   label: "Pro",   price: "$39/mo", color: "#8b5cf6",  border: "rgba(139,92,246,0.4)",  popular: true },
  { id: "elite", label: "Elite", price: "$79/mo", color: "#00f2ff",  border: "rgba(0,242,255,0.3)"   },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get("plan") || "pro");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    // 1. Create Supabase account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message || "Sign up failed. Please try again.");
      setLoading(false);
      return;
    }

    // 2. Create Stripe checkout session
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan, userId: data.user.id, email }),
    });

    const { url, error: checkoutError } = await res.json();

    if (checkoutError || !url) {
      setError("Payment setup failed. Please try again.");
      setLoading(false);
      return;
    }

    // 3. Redirect to Stripe checkout
    window.location.href = url;
  }

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(0,242,255,0.15), rgba(139,92,246,0.2))",
            border: "0.5px solid rgba(0,242,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#00f2ff",
          }}>D</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>David Training</span>
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Start your journey</h1>
        <p style={{ fontSize: 14, color: "#a1a1aa" }}>Choose your plan and create your account</p>
      </div>

      <div className="glass rounded-2xl p-8" style={{ border: "0.5px solid rgba(139,92,246,0.15)" }}>

        {/* Plan Selector */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>
            Select your plan
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {plans.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  position: "relative",
                  background: selectedPlan === plan.id
                    ? plan.id === "pro" ? "rgba(139,92,246,0.15)" : "rgba(0,242,255,0.08)"
                    : "rgba(255,255,255,0.02)",
                  border: `0.5px solid ${selectedPlan === plan.id ? plan.border : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10, padding: "12px 8px", cursor: "pointer",
                  transition: "all 0.2s", textAlign: "center",
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #8b5cf6, #00f2ff)",
                    color: "#050505", fontSize: 8, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>Popular</div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedPlan === plan.id ? plan.color : "#a1a1aa" }}>
                  {plan.label}
                </div>
                <div style={{ fontSize: 11, color: selectedPlan === plan.id ? plan.color : "#52525b", marginTop: 2 }}>
                  {plan.price}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          {error && (
            <div style={{
              background: "rgba(255,46,46,0.08)", border: "0.5px solid rgba(255,46,46,0.3)",
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ff6b6b",
            }}>
              {error}
            </div>
          )}

          {[
            { label: "Full Name", type: "text", value: fullName, set: setFullName, placeholder: "Pedro David Perez" },
            { label: "Email", type: "email", value: email, set: setEmail, placeholder: "you@example.com" },
            { label: "Password", type: "password", value: password, set: setPassword, placeholder: "Min. 8 characters" },
          ].map(field => (
            <div key={field.label} className="flex flex-col gap-2">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.set(e.target.value)}
                placeholder={field.placeholder}
                required
                minLength={field.type === "password" ? 8 : undefined}
                style={{
                  background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff",
                  outline: "none", width: "100%",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(0,242,255,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8b5cf6, #00f2ff)",
              color: "#050505", border: "none", borderRadius: 12,
              padding: "14px", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 0 24px rgba(139,92,246,0.25)",
              marginTop: 4,
            }}
          >
            {loading ? "Setting up your account..." : "Continue to Payment →"}
          </button>

          <p style={{ fontSize: 11, color: "#52525b", textAlign: "center", lineHeight: 1.5 }}>
            By continuing you agree to our Terms of Service. Cancel anytime.
          </p>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#a1a1aa" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#00f2ff", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
