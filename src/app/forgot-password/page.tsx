"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function ForgotContent() {
  const router = useRouter();
  const [step, setStep] = useState<"request"|"verify"|"reset">("request");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPass, setShowPass] = useState(false);

  const STEPS = [
    { n: 1, label: "Request", done: step !== "request", active: step === "request" },
    { n: 2, label: "Verify OTP", done: step === "reset", active: step === "verify" },
    { n: 3, label: "New Password", done: false, active: step === "reset" },
  ];

  const handleRequest = async () => {
    if (!identifier) { setError("Enter your email or mobile"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMobile(data.mobile || identifier);
      setStep("verify");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ mobile: identifier, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/login?reset=success");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#060E1A] flex items-center justify-center p-6">
      <div className="absolute inset-0 hero-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/4 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-10 border border-white/10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-3xl mx-auto mb-4">
              🔐
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Reset Password</h2>
            <p className="text-gray-500 text-sm">We'll get you back in</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.done ? "bg-green-500 text-white" : s.active ? "bg-cyan-500 text-white ring-2 ring-cyan-500/30" : "bg-white/10 text-gray-500"
                }`}>{s.done ? "✓" : s.n}</div>
                <span className={`ml-1.5 text-xs mr-3 ${s.active ? "text-cyan-400 font-semibold" : "text-gray-600"}`}>{s.label}</span>
                {i < 2 && <div className={`w-6 h-px mr-3 ${s.done ? "bg-green-500" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm text-center">⚠️ {error}</div>
          )}

          {step === "request" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email or Mobile</label>
                <input value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="your@email.com or 9876543210"
                  onKeyDown={e => e.key === "Enter" && handleRequest()}
                  className="input-base" />
              </div>
              <button onClick={handleRequest} disabled={loading}
                className="btn-neon w-full py-4 rounded-2xl font-black">
                {loading ? "Sending OTP…" : "📱 Send Reset OTP"}
              </button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-300 text-center">OTP sent to <span className="text-cyan-400 font-semibold">{mobile}</span></p>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Enter 6-Digit OTP</label>
                <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                  placeholder="123456" maxLength={6}
                  className="input-base text-center text-2xl font-black tracking-[0.5em]" />
              </div>
              <button onClick={() => { if (otp.length !== 6) { setError("Enter 6-digit OTP"); return; } setStep("reset"); }}
                disabled={otp.length !== 6}
                className="btn-neon w-full py-4 rounded-2xl font-black disabled:opacity-40">
                ✅ Verify OTP
              </button>
            </div>
          )}

          {step === "reset" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">New Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters" className="input-base pr-14" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white">{showPass?"Hide":"Show"}</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" className="input-base" />
              </div>
              <button onClick={handleReset} disabled={loading}
                className="btn-neon w-full py-4 rounded-2xl font-black">
                {loading ? "Resetting…" : "🔐 Set New Password"}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember it?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060E1A] flex items-center justify-center"><div className="text-cyan-400">Loading…</div></div>}>
      <ForgotContent />
    </Suspense>
  );
}
