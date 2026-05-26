"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(0,242,255,0.15), rgba(139,92,246,0.2))",
            border: "0.5px solid rgba(0,242,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#00f2ff",
          }}>D</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>David Training</span>
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: "#a1a1aa" }}>Sign in to your account to continue</p>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl p-8" style={{ border: "0.5px solid rgba(0,242,255,0.12)" }}>
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
            <label style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", letterSpacing: "0.5px", textTransform: "uppercase" }}>
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
              onFocus={e => e.target.style.borderColor = "rgba(0,242,255,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Password
              </label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "#00f2ff" }}>
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
              onFocus={e => e.target.style.borderColor = "rgba(0,242,255,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "rgba(0,242,255,0.3)" : "linear-gradient(135deg, #00f2ff, #8b5cf6)",
              color: "#050505", border: "none", borderRadius: 12,
              padding: "14px", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 0 24px rgba(0,242,255,0.2)",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#a1a1aa" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#00f2ff", fontWeight: 600 }}>
            Join now
          </Link>
        </p>
      </div>
    </div>
  );
}
