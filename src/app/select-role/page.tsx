"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth-context";

const ROLES = [
  {
    id: "public",
    title: "Public User & Kisan",
    subtitle: "Farmer, Citizen, Rural Resident",
    icon: "🌾",
    color: "border-green-500/40 hover:border-green-400 bg-green-950/20",
    badge: "Public Access",
    badgeColor: "bg-green-500/20 text-green-300 border-green-500/40",
    demoMobile: "9800000001",
    demoPass: "Demo@1234",
    targetUrl: "/dashboard?view=kisan",
    features: [
      "Simple localized rain probability & hourly meter",
      "Crop harvesting & pesticide spraying advisories",
      "Nearest safe flood shelter & evacuation route navigation",
      "Audio advisories in Hindi & regional languages",
      "Emergency SOS helplines (112, 1077)",
    ],
    registerUrl: "/register?role=public",
  },
  {
    id: "government",
    title: "Government Officer",
    subtitle: "IMD, NDMA, SDMA, District Collector",
    icon: "🏛️",
    color: "border-blue-500/40 hover:border-blue-400 bg-blue-950/20",
    badge: "Official Verification Required",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    demoMobile: "9800000002",
    demoPass: "Demo@1234",
    targetUrl: "/government",
    features: [
      "Common Alerting Protocol (CAP) emergency broadcast dispatcher",
      "NDRF battalion & SDRF rescue boat deployment tracker",
      "Relief shelter occupancy & food ration logistics monitor",
      "One-click official IMD Flood Inundation Bulletin generation",
      "District-wide population vulnerability analytics",
    ],
    registerUrl: "/register?role=government",
  },
  {
    id: "researcher",
    title: "Scientist & Researcher",
    subtitle: "Meteorologist, Academic, AI Specialist",
    icon: "🔬",
    color: "border-purple-500/40 hover:border-purple-400 bg-purple-950/20",
    badge: "Scientific Lab Access",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    demoMobile: "9800000004",
    demoPass: "Demo@1234",
    targetUrl: "/ai-observatory",
    features: [
      "Deep AI Observatory with SHAP feature explainability",
      "Model benchmark leaderboard (CSI, POD, FAR, RMSE)",
      "INSAT-3D multi-spectral band viewer & Doppler radar reflectivity",
      "Physics-Informed Neural Network (PINN) hydrodynamics",
      "Raw NetCDF-4, GeoJSON & CSV data export",
    ],
    registerUrl: "/register?role=researcher",
  },
  {
    id: "admin",
    title: "System Administrator",
    subtitle: "Mission Control & Infrastructure Ops",
    icon: "⚙️",
    color: "border-red-500/40 hover:border-red-400 bg-red-950/20",
    badge: "Master Access",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
    demoMobile: "9800000003",
    demoPass: "Admin@1234",
    targetUrl: "/admin",
    features: [
      "User verification, approval & deactivation control",
      "Live MongoDB Atlas cluster telemetry & connection monitoring",
      "API gateway traffic, latency & error analytics",
      "Model deployment pipeline & retraining scheduler",
      "System database re-seeding & integrity tools",
    ],
    registerUrl: "/login",
  },
];

export default function SelectRolePage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  const handleInstantDemo = async (role: typeof ROLES[0]) => {
    setLoggingInRole(role.id);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: role.demoMobile, password: role.demoPass }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        login(data.user);
        router.push(role.targetUrl);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#060E1A] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-4 transition-colors">
            ← Back to Home
          </Link>
          <div className="text-5xl mb-3">🌧️</div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Choose Your Operational Portal
          </h1>
          <p className="text-gray-400 text-base mt-2 max-w-xl mx-auto">
            VARSHANETRA tailors its data intelligence, tools, and mission workflows specifically for your role
          </p>
        </div>

        {/* 4 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ROLES.map((role) => (
            <GlassCard
              key={role.id}
              className={`p-6 border-2 ${role.color} transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{role.icon}</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${role.badgeColor}`}>
                    {role.badge}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white">{role.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5 mb-4">{role.subtitle}</p>

                <div className="space-y-2 mb-6">
                  {role.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-cyan-400 mt-0.5">✓</span>
                      <span className="leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleInstantDemo(role)}
                  disabled={loggingInRole !== null}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs text-center block transition-all shadow-lg shadow-cyan-500/20"
                >
                  {loggingInRole === role.id ? "🚀 Entering Portal..." : `⚡ Instant ${role.title.split(" ")[0]} Demo`}
                </button>
                <Link
                  href={role.registerUrl}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs text-center block border border-white/10 transition-all"
                >
                  Create Custom Account
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Bottom Demo Login Shortcut */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-500">
            Evaluating for Smart India Hackathon 2026? Click any <strong>Instant Demo</strong> button above to launch that portal, or use manual credentials on the{" "}
            <Link href="/login" className="text-cyan-400 hover:underline font-bold">
              Login Page
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
