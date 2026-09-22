"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

function OTPContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const mobile   = params.get("mobile")   || "";
  const purpose  = params.get("purpose")  || "register";
  const demoOtp  = params.get("demoOtp")  || "";   // Passed from register/login in demo mode

  const [otp, setOtp] = useState(["","","","","",""]);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [demoBanner, setDemoBanner] = useState(!!demoOtp);
  const inputs = useRef<(HTMLInputElement|null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Auto-fill demo OTP after 3 seconds if present
  useEffect(() => {
    if (demoOtp && demoOtp.length === 6) {
      const t = setTimeout(() => {
        setOtp(demoOtp.split(""));
        inputs.current[5]?.focus();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [demoOtp]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); inputs.current[5]?.focus(); }
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the complete 6-digit OTP"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp: code, purpose }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed"); setLoading(false); return; }

      if (purpose === "forgot") {
        router.push(`/reset-password?mobile=${encodeURIComponent(mobile)}&otp=${code}`);
        return;
      }

      // ── CRITICAL: call login() to set auth context, then wait a tick
      // so the browser has time to commit the session cookie before the
      // middleware-protected redirect fires. Without this wait the
      // middleware sees no cookie and bounces back to /login.
      if (data.user) {
        login(data.user);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Role-based redirect
      const role = data.user?.userType;
      if (role === "admin") router.replace("/admin");
      else if (role === "government") router.replace("/government");
      else if (role === "researcher") router.replace("/dashboard");
      else router.replace("/dashboard");
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const resend = async () => {
    setResending(true);
    try {
      await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, purpose }),
      });
      setCountdown(60); setOtp(["","","","","",""]);
    } catch {}
    setResending(false);
  };

  const maskedMobile = mobile.replace(/(\+91)?(\d{6})(\d{4})/, "+91 XXXXXX $3");

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background:"var(--bg-primary)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)", backgroundSize:"60px 60px" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Demo OTP banner */}
        {demoBanner && demoOtp && (
          <div className="mb-4 p-4 rounded-2xl flex items-center justify-between"
            style={{ background:"rgba(0,212,255,0.1)", border:"2px solid rgba(0,212,255,0.4)" }}>
            <div>
              <p className="text-xs font-bold" style={{ color:"#00D4FF" }}>🎯 DEMO MODE — Your OTP</p>
              <p className="text-3xl font-black tracking-widest mt-1" style={{ color:"#00D4FF" }}>{demoOtp}</p>
              <p className="text-xs mt-1" style={{ color:"var(--text-tertiary)" }}>Auto-filled in 1.5 seconds</p>
            </div>
            <button onClick={() => setDemoBanner(false)} style={{ color:"var(--text-tertiary)" }}>✕</button>
          </div>
        )}

        <div className="p-8 rounded-2xl" style={{ background:"var(--bg-elevated)", border:"1px solid var(--border-cyan)" }}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5"
              style={{ background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.3)" }}>
              📱
            </div>
            <h2 className="text-2xl font-black mb-2">Verify Your Mobile</h2>
            <p className="text-sm" style={{ color:"var(--text-secondary)" }}>
              We sent a 6-digit OTP to<br/>
              <span className="font-semibold" style={{ color:"#00D4FF" }}>{maskedMobile}</span>
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm text-center font-medium" style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#EF4444" }}>
              ⚠️ {error}
            </div>
          )}

          {/* 6-box OTP input */}
          <div className="flex justify-center gap-3 mb-7" onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                className="w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all duration-200 outline-none"
                style={{
                  background: d ? "rgba(0,212,255,0.1)" : "var(--bg-card)",
                  borderColor: d ? "#00D4FF" : "var(--border)",
                  color: d ? "#00D4FF" : "var(--text-primary)",
                  boxShadow: d ? "0 0 10px rgba(0,212,255,0.2)" : "none",
                }}
              />
            ))}
          </div>

          {/* Countdown */}
          <p className="text-center text-sm mb-6" style={{ color:"var(--text-secondary)" }}>
            {countdown > 0 ? (
              <>Resend OTP in <span className="font-bold tabular-nums" style={{ color:"#00D4FF" }}>0:{countdown.toString().padStart(2, "0")}</span></>
            ) : (
              <button onClick={resend} disabled={resending} className="font-semibold transition-colors" style={{ color:"#00D4FF" }}>
                {resending ? "Sending..." : "↻ Resend OTP"}
              </button>
            )}
          </p>

          <button onClick={verify} disabled={loading || otp.join("").length !== 6}
            className="w-full py-4 rounded-xl text-base font-black btn-neon disabled:opacity-50 disabled:cursor-not-allowed mb-4">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25}/>
                  <path fill="currentColor" opacity={0.75} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Verifying...
              </span>
            ) : "✅ Verify & Enter"}
          </button>

          <div className="flex justify-between text-sm" style={{ color:"var(--text-tertiary)" }}>
            <Link href={purpose === "register" ? "/register" : "/login"}
              className="transition-colors" style={{ color:"var(--text-tertiary)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#00D4FF"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
              ← Change number
            </Link>
            <Link href="/" className="transition-colors" style={{ color:"var(--text-tertiary)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#00D4FF"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--bg-primary)" }}>
        <div className="font-bold" style={{ color:"#00D4FF" }}>Loading…</div>
      </div>
    }>
      <OTPContent />
    </Suspense>
  );
}
