"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { MODEL_CONFIG } from "@/lib/seed-data";

const SERVICES = [
  { name: "API Server", status: "healthy", latency: "45ms", uptime: "99.97%", icon: "🖥️" },
  { name: "MongoDB Atlas DB", status: "healthy", latency: "12ms", uptime: "99.99%", icon: "🗄️" },
  { name: "INSAT-3D Feed", status: "healthy", latency: "320ms", uptime: "98.5%", icon: "🛰️" },
  { name: "Doppler Radars (39)", status: "degraded", latency: "180ms", uptime: "95.2%", icon: "📡" },
  { name: "AWS Stations (785/800)", status: "healthy", latency: "95ms", uptime: "98.1%", icon: "🌡️" },
  { name: "NWP Model Feed", status: "healthy", latency: "450ms", uptime: "97.8%", icon: "🖥️" },
  { name: "Alert Dispatcher", status: "healthy", latency: "12ms", uptime: "99.9%", icon: "📱" },
  { name: "AI Inference Engine", status: "healthy", latency: "1.2s", uptime: "99.5%", icon: "🤖" },
];

const MODEL_DEPLOY_STATUS = [
  { name: "ConvLSTM v2.3", deployed: "2026-07-01", status: "production", version: "2.3.1", accuracy: "84%" },
  { name: "U-Net v1.8", deployed: "2026-06-15", status: "production", version: "1.8.0", accuracy: "82%" },
  { name: "Transformer v3.1", deployed: "2026-07-05", status: "production", version: "3.1.2", accuracy: "85%" },
  { name: "XGBoost v4.2", deployed: "2026-07-10", status: "production", version: "4.2.0", accuracy: "80%" },
  { name: "Ensemble v1.5", deployed: "2026-07-10", status: "production", version: "1.5.0", accuracy: "87%" },
];

export default function SystemHealthPage() {
  const { user } = useAuth();
  const [dbHealth, setDbHealth] = useState<"checking" | "healthy" | "error">("checking");
  const [reseeding, setReseeding] = useState(false);
  const [reseedResult, setReseedResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health").then(r => r.json()).then(d => setDbHealth(d.ok ? "healthy" : "error")).catch(() => setDbHealth("error"));
  }, []);

  const handleReseed = async () => {
    setReseeding(true);
    setReseedResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReseedResult(`✅ Database re-seeded successfully! Stations: ${data.counts.stations}, Warnings: ${data.counts.warnings}, Predictions: ${data.counts.predictions}`);
      } else {
        setReseedResult(`❌ Seed failed: ${data.error}`);
      }
    } catch (e) { setReseedResult("❌ Network error"); }
    setReseeding(false);
  };

  if (!user || user.userType !== "admin") return <div className="min-h-screen bg-transparent flex items-center justify-center"><p className="text-red-600 font-medium">Admin access required</p></div>;

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="mt-16 max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">← Admin</Link>
          <span className="text-gray-600">›</span>
          <h1 className="text-3xl font-black">🖥️ System Health & Model Management</h1>
        </div>

        {/* Database Health */}
        <GlassCard className={`p-4 mb-6 border ${dbHealth==="healthy"?"border-green-500/30 bg-green-500/5":dbHealth==="error"?"border-red-500/30 bg-red-500/5":"border-white/10"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${dbHealth==="healthy"?"bg-green-500 animate-pulse":dbHealth==="error"?"bg-red-500":"bg-yellow-500 animate-pulse"}`} />
              <div>
                <p className="font-bold">Database Connection</p>
                <p className={`text-sm ${dbHealth==="healthy"?"text-green-400":dbHealth==="error"?"text-red-400":"text-yellow-400"}`}>
                  {dbHealth==="checking"?"Checking...":dbHealth==="healthy"?"MongoDB Atlas Cluster — Connected & Healthy":"Connection Error — Check MONGODB_URI"}
                </p>
              </div>
            </div>
            <button onClick={() => { setDbHealth("checking"); fetch("/api/health").then(r=>r.json()).then(d=>setDbHealth(d.ok?"healthy":"error")).catch(()=>setDbHealth("error")); }}
              className="px-4 py-2 rounded-xl bg-white/8 border border-white/15 text-sm hover:bg-white/12 transition-all">🔄 Recheck</button>
          </div>
        </GlassCard>

        {/* Services */}
        <div className="mb-6">
          <h2 className="font-bold text-xl mb-4">🛰️ Service Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SERVICES.map((s, i) => (
              <GlassCard key={i} className={`p-4 border ${s.status==="healthy"?"border-green-500/20":s.status==="degraded"?"border-yellow-500/20":"border-red-500/20"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <div className={`w-2 h-2 rounded-full ${s.status==="healthy"?"bg-green-500":s.status==="degraded"?"bg-yellow-500":"bg-red-500"}`} />
                </div>
                <p className="text-sm font-bold text-white">{s.name}</p>
                <div className="mt-2 space-y-0.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Latency</span><span className="text-cyan-400">{s.latency}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Uptime</span><span className="text-green-400">{s.uptime}</span></div>
                </div>
                <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded font-bold ${s.status==="healthy"?"bg-green-500/20 text-green-400":s.status==="degraded"?"bg-yellow-500/20 text-yellow-400":"bg-red-500/20 text-red-400"}`}>
                  {s.status.toUpperCase()}
                </span>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Model Management */}
        <div className="mb-6">
          <h2 className="font-bold text-xl mb-4">🤖 AI Model Deployment</h2>
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm data-table">
              <thead><tr><th>Model</th><th>Version</th><th>Status</th><th>Accuracy</th><th>Deployed</th><th>Actions</th></tr></thead>
              <tbody>
                {MODEL_DEPLOY_STATUS.map((m, i) => (
                  <tr key={i}>
                    <td className="font-bold text-white">{m.name}</td>
                    <td className="font-mono text-cyan-400">{m.version}</td>
                    <td><span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold">● {m.status.toUpperCase()}</span></td>
                    <td className="text-yellow-400 font-bold">{m.accuracy}</td>
                    <td className="text-gray-500">{m.deployed}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-all">📊 Metrics</button>
                        <button className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition-all">🔄 Retrain</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </div>

        {/* Database Management */}
        <GlassCard className="p-5">
          <h2 className="font-bold text-xl mb-4">🗄️ Database Management</h2>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: "Rainfall Obs.", value: "~350", icon: "🌧️" },
              { label: "AI Predictions", value: "~900", icon: "🤖" },
              { label: "Active Warnings", value: "~20-40", icon: "⚠️" },
              { label: "Weather Stations", value: "72", icon: "📡" },
              { label: "Community Reports", value: "varies", icon: "👥" },
              { label: "Users", value: "seed incl.", icon: "👤" },
            ].map((s, i) => (
              <div key={i} className="bg-white/4 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div><p className="text-sm font-bold text-white">{s.label}</p><p className="text-xs text-cyan-400">{s.value} records</p></div>
              </div>
            ))}
          </div>

          {reseedResult && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${reseedResult.startsWith("✅")?"bg-green-500/20 border border-green-500/40 text-green-400":"bg-red-500/20 border border-red-500/40 text-red-400"}`}>
              {reseedResult}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleReseed} disabled={reseeding}
              className="btn-neon px-6 py-3 rounded-xl font-bold disabled:opacity-50">
              {reseeding ? "⏳ Reseeding..." : "🌱 Re-seed Database"}
            </button>
            <p className="text-xs text-gray-500 self-center">⚠️ This truncates all data and re-seeds with fresh realistic data. Demo users are preserved.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
