"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth-context";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LivePulse } from "@/components/ui/LivePulse";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const ACTIVITY_LOG = [
  { time: "2 min ago", user: "Dr. Priya Verma", action: "Generated Bulletin for Mumbai", type: "bulletin" },
  { time: "8 min ago", user: "System", action: "RED WARNING issued for Guwahati", type: "warning" },
  { time: "15 min ago", user: "Rahul Nair", action: "Community report verified — Pune", type: "community" },
  { time: "22 min ago", user: "System", action: "AI models retrained with latest data", type: "system" },
  { time: "1 hr ago", user: "Admin", action: "New government officer approved", type: "user" },
  { time: "2 hr ago", user: "System", action: "Database seeded with fresh data", type: "system" },
];

const SYSTEM_CHART = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`, requests: Math.floor(200 + Math.random() * 300), errors: Math.floor(Math.random() * 5), latency: Math.floor(50 + Math.random() * 100),
}));

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, warnings: 0, stations: 785, predictions: 45892, uptime: 99.97, accuracy: 87 });
  const [adminTab, setAdminTab] = useState<"overview" | "users" | "system" | "models">("overview");

  useEffect(() => {
    if (user && user.userType !== "admin") { router.push("/dashboard"); return; }
    fetch("/api/dashboard/overview").then(r => r.json()).then(d => {
      setStats(s => ({ ...s, warnings: d.warnings?.total || 0, stations: d.statistics?.activeStations || 785, predictions: d.statistics?.predictionsToday || 45892, accuracy: d.statistics?.modelAccuracy || 87 }));
    }).catch(() => {});
    fetch("/api/admin/stats").then(r => r.json()).then(d => setStats(s => ({ ...s, users: d.totalUsers || 0 }))).catch(() => {});
  }, [user, router]);

  if (!user) return <div className="min-h-screen bg-transparent flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  if (user.userType !== "admin") return <div className="min-h-screen bg-transparent flex items-center justify-center"><p className="text-red-600 font-medium">Access denied. Admins only.</p></div>;

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="mt-16 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black">⚙️ Admin Dashboard</h1>
            <p className="text-gray-400">VARSHANETRA System Administration Panel</p>
          </div>
          <div className="flex items-center gap-3">
            <LivePulse label="System" status="HEALTHY" color="green" />
            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg font-bold">Uptime: {stats.uptime}%</span>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="flex gap-2 mb-6">
          {[{id:"overview",l:"📊 Overview"},{id:"users",l:"👥 Users"},{id:"system",l:"🖥️ System"},{id:"models",l:"🤖 Models"}].map(t => (
            <Link key={t.id} href={t.id === "users" ? "/admin/users" : t.id === "system" ? "/admin/system" : "#"}>
              <button onClick={() => t.id !== "users" && t.id !== "system" && setAdminTab(t.id as typeof adminTab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${adminTab===t.id?"bg-cyan-500/20 border-cyan-500/40 text-cyan-400":"bg-white/4 border-white/10 text-gray-400 hover:bg-white/8"}`}>
                {t.l}
              </button>
            </Link>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {[
            { label:"Total Users", value:stats.users||142, icon:"👥", color:"text-cyan-400" },
            { label:"Active Warnings", value:stats.warnings, icon:"⚠️", color:"text-orange-400" },
            { label:"Stations Online", value:stats.stations, icon:"📡", color:"text-green-400" },
            { label:"Predictions Today", value:stats.predictions, icon:"🤖", color:"text-purple-400" },
            { label:"AI Accuracy", value:stats.accuracy, icon:"🎯", color:"text-yellow-400", suffix:"%" },
            { label:"Uptime", value:99, icon:"⚡", color:"text-green-400", suffix:"%" },
          ].map((s, i) => (
            <GlassCard key={i} className="p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-black ${s.color}`}><AnimatedCounter target={s.value} duration={1.5} />{s.suffix || ""}</div>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Request Chart */}
          <GlassCard className="col-span-2 p-5">
            <h2 className="font-bold text-lg mb-4">📈 API Requests (Last 24h)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={SYSTEM_CHART.slice(-12)}>
                <defs><linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} /><stop offset="95%" stopColor="#00D4FF" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize:10, fill:"#555" }} />
                <YAxis tick={{ fontSize:10, fill:"#555" }} />
                <Tooltip contentStyle={{ background:"#0A1628", border:"1px solid rgba(0,212,255,0.3)", borderRadius:"8px", fontSize:"11px" }} />
                <Area type="monotone" dataKey="requests" stroke="#00D4FF" fill="url(#reqGrad)" strokeWidth={2} name="Requests" />
                <Line type="monotone" dataKey="errors" stroke="#FF4444" strokeWidth={1.5} name="Errors" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-5">
            <h2 className="font-bold text-lg mb-4">⚡ Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href:"/admin/users", label:"👥 Manage Users", color:"bg-blue-600/60 hover:bg-blue-600/80" },
                { href:"/admin/system", label:"🖥️ System Health", color:"bg-green-600/60 hover:bg-green-600/80" },
                { href:"/admin/models", label:"🤖 Model Management", color:"bg-purple-600/60 hover:bg-purple-600/80" },
                { href:"/api/seed", label:"🌱 Re-seed Database", color:"bg-orange-600/60 hover:bg-orange-600/80" },
                { href:"/warnings", label:"⚠️ View All Warnings", color:"bg-red-600/60 hover:bg-red-600/80" },
              ].map((a, i) => (
                <Link key={i} href={a.href}>
                  <button className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all ${a.color}`}>{a.label}</button>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Activity Log */}
        <GlassCard className="p-5 mt-6">
          <h2 className="font-bold text-lg mb-4">📋 Recent Activity Log</h2>
          <div className="space-y-2">
            {ACTIVITY_LOG.map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/4 rounded-xl border border-white/8 hover:bg-white/6 transition-all">
                <span className="text-xl">{log.type==="warning"?"⚠️":log.type==="bulletin"?"📋":log.type==="community"?"👥":log.type==="user"?"👤":"⚙️"}</span>
                <div className="flex-1">
                  <p className="text-sm text-white">{log.action}</p>
                  <p className="text-xs text-gray-500">{log.user}</p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
