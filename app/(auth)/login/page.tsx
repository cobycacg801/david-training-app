"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const G = "#c9a84c";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))",
            border: "0.5px solid rgba(201,168,76,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: G,
          }}>D</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>David Training</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#52525b", letterSpacing: 1.5, textTransform: "uppercase" }}>Elite Coaching App</div>
          </div>
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Welcome back</h1>
        <p style={{ fontSize: 13, color: "#71717a" }}>Sign in to your account to continue</p>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl p-8" style={{ border: "0.5px solid rgba(201,168,76,0.18)" }}>
        <form onSubmit={handleLogin} className="flex flex-col gap-5">

          {error && (
            <div style={{
              background: "rgba(255,46,46,0.08)", border: "0.5px solid rgba(255,46,46,0.3)",
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ff6b6b",
            }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#71717a", letterSpacing: 1, textTransform: "uppercase" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff",
                outline: "none", width: "100%",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label style={{ fontSize: 11, fontWeight: 700, color: "#71717a", letterSpacing: 1, textTransform: "uppercase" }}>
                Password
              </label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: G, fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff",
                outline: "none", width: "100%",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading
                ? "rgba(201,168,76,0.3)"
                : `linear-gradient(135deg, ${G}, #e8d5a3)`,
              color: "#080808", border: "none", borderRadius: 12,
              padding: "14px", fontSize: 14, fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 0 28px rgba(201,168,76,0.25)",
              letterSpacing: 0.3,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#71717a" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: G, fontWeight: 700 }}>
            Join now
          </Link>
        </p>
      </div>
    </div>
  );
}
