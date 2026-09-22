"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const REDIRECT: Record<string, string> = {
    admin:      "/admin",
    government: "/government",
    researcher: "/dashboard",
    public:     "/dashboard",
  };

  useEffect(() => {
    if (!authLoading && user) {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/dashboard';
      router.replace(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async () => {
    setError("");
    if (!identifier) { setError("Enter your email or mobile number"); return; }
    if (mode === "password" && !password) { setError("Enter your password"); return; }
    setLoading(true);
    try {
      if (mode === "otp") {
        const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, otpMode: true }) });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
        router.push(`/verify-otp?mobile=${encodeURIComponent(identifier)}&purpose=login`);
        return;
      }
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password, rememberMe }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      login(data.user);
      // Wait a tick so the session cookie is committed before the protected redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace(REDIRECT[data.user.userType] || "/dashboard");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  if (authLoading) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>🌧️</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>LOADING</div>
        </div>
      </div>
    );
  }
  if (user) return (
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>🌧️</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>REDIRECTING…</div>
      </div>
    </div>
  );

  const inputStyle = {
    background: "var(--bg-surface)", border: "1px solid var(--border-strong)",
    borderRadius: "var(--r-md)", color: "var(--text-primary)",
    fontFamily: "var(--font-body)", fontSize: "0.9375rem",
    padding: "0.7rem 0.875rem", width: "100%", outline: "none",
    transition: "border-color 200ms, box-shadow 200ms",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", background: "var(--bg-base)", fontFamily: "var(--font-body)" }}>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div style={{ width: "42%", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-surface)", borderRight: "1px solid var(--border)", padding: "48px 40px", position: "relative", overflow: "hidden" }} className="hide-tablet">
        {/* Grid background */}
        <div className="hero-grid" style={{ position: "absolute", inset: 0, opacity: 0.5 }}/>
        {/* Radial glow */}
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 65%)", pointerEvents: "none" }}/>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 360, width: "100%" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 40 }}>
            <span style={{ fontSize: 28 }}>🌧️</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>VARSHANETRA</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>National Flood Intelligence</div>
            </div>
          </Link>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Secure Intelligence Portal
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 32 }}>
            Authenticated access to real-time flood intelligence for government officers, researchers, and citizens.
          </p>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "◎", label: "AI-powered flood predictions", desc: "5-model ensemble with SHAP explainability" },
              { icon: "≋", label: "3D inundation simulation",     desc: "Physics-informed PINN flood modelling" },
              { icon: "⊞", label: "Government command tools",     desc: "Resource dispatch, bulletin generation" },
              { icon: "◈", label: "VARSHA AI assistant",          desc: "Natural language flood intelligence" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", transition: "border-color 200ms" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
              >
                <span style={{ fontSize: 18, color: "var(--cyan)", flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Role badges */}
          <div style={{ marginTop: 28, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { label: "Expert", color: "#A78BFA" },
              { label: "Government", color: "#60A5FA" },
              { label: "Citizen", color: "#34D399" },
            ].map(r => (
              <span key={r.label} style={{
                padding: "3px 10px", borderRadius: "var(--r-full)",
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.07em", textTransform: "uppercase",
                color: r.color, background: r.color + "15",
                border: `1px solid ${r.color}30`,
              }}>{r.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ───────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Back link */}
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)", textDecoration: "none", marginBottom: 32, transition: "color 150ms" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ← Back to home
          </Link>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.625rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>Sign in</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Access your VARSHANETRA account</p>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", marginBottom: 24 }}>
            {(["password", "otp"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: "var(--r-sm)",
                  background: mode === m ? "var(--bg-panel)" : "transparent",
                  border: `1px solid ${mode === m ? "var(--border-accent)" : "transparent"}`,
                  color: mode === m ? "var(--cyan)" : "var(--text-muted)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 150ms",
                  fontFamily: "var(--font-body)",
                }}>
                {m === "password" ? "🔑 Password" : "📱 OTP Login"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: "var(--r-md)", background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red-bright)", fontSize: 13, fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Identifier */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                {mode === "otp" ? "Mobile Number" : "Email or Mobile"}
              </label>
              <input value={identifier} onChange={e => setIdentifier(e.target.value)}
                placeholder={mode === "otp" ? "10-digit mobile" : "email@example.com or 9876543210"}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={inputStyle}
                onFocus={e => { (e.target as HTMLElement).style.borderColor = "var(--border-focus)"; (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(6,182,212,0.10)"; }}
                onBlur={e  => { (e.target as HTMLElement).style.borderColor = "var(--border-strong)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            {mode === "password" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", margin: 0 }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--cyan)", textDecoration: "none" }}>Forgot?</Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{ ...inputStyle, paddingRight: "3rem" }}
                    onFocus={e => { (e.target as HTMLElement).style.borderColor = "var(--border-focus)"; (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(6,182,212,0.10)"; }}
                    onBlur={e  => { (e.target as HTMLElement).style.borderColor = "var(--border-strong)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {/* Remember me */}
            {mode === "password" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: "var(--cyan)", width: 14, height: 14, margin: 0 }}/>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 400 }}>Remember me for 30 days</span>
              </label>
            )}

            {/* Submit */}
            <button onClick={handleLogin} disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center", fontFamily: "var(--font-body)", marginTop: 4 }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(7,11,20,0.3)", borderTopColor: "var(--text-on-accent)", animation: "spin-slow 0.8s linear infinite" }}/>
                  Signing in…
                </span>
              ) : mode === "password" ? "Sign In →" : "Send OTP →"}
            </button>

            {/* Register link */}
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", paddingTop: 8 }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" style={{ color: "var(--cyan)", fontWeight: 600, textDecoration: "none" }}>Create one free</Link>
            </p>

            {/* Demo note */}
            <div style={{ padding: "10px 14px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", textAlign: "center" }}>
              <span className="badge-demo" style={{ marginRight: 6 }}>DEMO</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Register to create a demo account — OTP visible in response</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
