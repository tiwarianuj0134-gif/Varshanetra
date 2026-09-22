"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobileParam = searchParams.get("mobile") || "";
  const otpParam = searchParams.get("otp") || "";

  const [mobile, setMobile] = useState(mobileParam);
  const [otp, setOtp] = useState(otpParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!mobile) {
      setError("Please enter your registered mobile number");
      return;
    }
    if (!otp || otp.length !== 6) {
      setError("Please provide the 6-digit OTP");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060E1A] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-4xl mb-2">🌧️</Link>
          <h1 className="text-2xl font-black text-white">Create New Password</h1>
          <p className="text-gray-400 text-sm mt-1">Set a new, secure password for your VARSHANETRA account</p>
        </div>

        <GlassCard className="p-8">
          {success ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-black text-green-400 mb-2">Password Reset Successfully!</h2>
              <p className="text-gray-400 text-sm">Redirecting to login page...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm text-center">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Registered Mobile Number</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm font-mono tracking-widest text-center"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-white text-xs"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm btn-neon disabled:opacity-50 mt-2"
              >
                {loading ? "⏳ Updating Password..." : "🔐 Save New Password"}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                Remember your password?{" "}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                  Back to Login
                </Link>
              </p>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060E1A] flex items-center justify-center text-cyan-400">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
