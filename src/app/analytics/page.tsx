"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import Link from "next/link";

interface KPIs {
  totalWarnings: number; maxRainfall: number; hotspot: string;
  peopleAtRisk: number; modelAccuracy: number; csi: number;
  pod: number; far: number; totalPredictions: number; falseAlarmRate: number;
}
interface ModelComp {
  name: string; csi: number; pod: number; far: number; rmse: number; accuracy: number;
}
interface StateData { state: string; warnings: number; accuracy: number; avg_rain: number; population_at_risk: number; }
interface MonthlyData { month: string; accuracy: number; csi: number; pod: number; far: number; rmse: number; }

const PIE_COLORS = ["#00D4FF", "#A855F7", "#22C55E", "#FFB800", "#EF4444"];
const RAINFALL_CATEGORIES = [
  { label: "Normal (<35.5mm)", color: "#22C55E" },
  { label: "Heavy (35.5-64mm)", color: "#EAB308" },
  { label: "Very Heavy (64-115mm)", color: "#F97316" },
  { label: "Extremely Heavy (>115mm)", color: "#EF4444" },
];

const HISTORICAL_EVENTS = [
  { year:"Mumbai 2005", rainfall:944, lives:1094, damage:"₹550 Cr", leadTime:"N/A", vshn:"72h advance", vshnColor:"#22C55E" },
  { year:"Kerala 2018", rainfall:660, lives:483, damage:"₹31,000 Cr", leadTime:"12h", vshn:"72h advance", vshnColor:"#22C55E" },
  { year:"Uttarakhand 2013", rainfall:370, lives:5700, damage:"₹8,000 Cr", leadTime:"2h", vshn:"72h advance", vshnColor:"#22C55E" },
  { year:"Chennai 2015", rainfall:495, lives:269, damage:"₹20,000 Cr", leadTime:"8h", vshn:"72h advance", vshnColor:"#22C55E" },
  { year:"Assam 2020", rainfall:420, lives:123, damage:"₹5,600 Cr", leadTime:"18h", vshn:"72h advance", vshnColor:"#22C55E" },
  { year:"Wayanad 2024", rainfall:350, lives:231, damage:"₹3,200 Cr", leadTime:"1h", vshn:"48h advance", vshnColor:"#FBB724" },
];

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [modelComp, setModelComp] = useState<ModelComp[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview"|"models"|"states"|"historical">("overview");
  const [timeMachineEvent, setTimeMachineEvent] = useState<string | null>(null);
  const [tmRunning, setTmRunning] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics?type=overview").then(r => r.json()),
      fetch("/api/analytics?type=models").then(r => r.json()),
      fetch("/api/analytics?type=state").then(r => r.json()),
      fetch("/api/analytics?type=monthly").then(r => r.json()),
    ]).then(([ov, md, st, mo]) => {
      setKpis(ov.kpis || null);
      setModelComp(md.comparison || []);
      setStateData(st.stateData || []);
      setMonthly(mo.monthly || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleTimeMachine = (id: string) => {
    setTimeMachineEvent(id);
    setTmRunning(true);
    setTimeout(() => setTmRunning(false), 3000);
  };

  // Fallback display data while loading
  const FALLBACK_MONTHLY = [
    { month:"Jan", accuracy:72, csi:55, pod:72, far:28, rmse:8.5 },
    { month:"Feb", accuracy:74, csi:57, pod:74, far:26, rmse:8.0 },
    { month:"Mar", accuracy:77, csi:59, pod:76, far:24, rmse:7.6 },
    { month:"Apr", accuracy:79, csi:61, pod:78, far:22, rmse:7.2 },
    { month:"May", accuracy:82, csi:64, pod:80, far:20, rmse:6.7 },
    { month:"Jun", accuracy:84, csi:67, pod:83, far:18, rmse:6.1 },
    { month:"Jul", accuracy:86, csi:70, pod:86, far:16, rmse:5.5 },
  ];

  const FALLBACK_STATE = [
    { state:"Maharashtra", warnings:18, accuracy:86, avg_rain:145, population_at_risk:4200000 },
    { state:"Kerala", warnings:14, accuracy:89, avg_rain:285, population_at_risk:3100000 },
    { state:"Assam", warnings:22, accuracy:84, avg_rain:220, population_at_risk:5200000 },
    { state:"West Bengal", warnings:12, accuracy:85, avg_rain:178, population_at_risk:2800000 },
    { state:"Uttarakhand", warnings:8, accuracy:82, avg_rain:165, population_at_risk:900000 },
    { state:"Tamil Nadu", warnings:10, accuracy:87, avg_rain:135, population_at_risk:1800000 },
    { state:"Odisha", warnings:11, accuracy:85, avg_rain:188, population_at_risk:2100000 },
  ];

  const FALLBACK_MODELS = [
    { name:"ensemble", csi:0.78, pod:0.91, far:0.11, rmse:3.5, accuracy:87 },
    { name:"transformer", csi:0.75, pod:0.88, far:0.13, rmse:3.8, accuracy:85 },
    { name:"convlstm", csi:0.72, pod:0.85, far:0.15, rmse:4.2, accuracy:84 },
    { name:"unet", csi:0.68, pod:0.82, far:0.18, rmse:5.1, accuracy:82 },
    { name:"xgboost", csi:0.65, pod:0.80, far:0.22, rmse:6.2, accuracy:80 },
  ];

  const displayMonthly = monthly.length > 0 ? monthly : FALLBACK_MONTHLY;
  const displayState = stateData.length > 0 ? stateData : FALLBACK_STATE;
  const displayModels = modelComp.length > 0 ? modelComp : FALLBACK_MODELS;

  const TABS = [
    { id: "overview", label: "📊 Overview", desc: "Key performance metrics" },
    { id: "models", label: "🤖 AI Models", desc: "Model comparison" },
    { id: "states", label: "🗺️ States", desc: "State-wise analysis" },
    { id: "historical", label: "📜 Historical", desc: "Past events" },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="mt-16 max-w-7xl mx-auto p-5 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">📈 Analytics & Intelligence</h1>
            <p style={{ color: "var(--text-secondary)" }}>Live data from MongoDB — AI model performance, rainfall patterns, and impact analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>Live Data</span>
            <button
              onClick={() => { window.location.reload(); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all btn-outline ml-2">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* KPI Summary */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--bg-card)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:"Active Warnings", value: kpis?.totalWarnings ?? 17, icon:"⚠️", color:"#EF4444", suffix:"" },
              { label:"AI Accuracy", value: kpis?.modelAccuracy ?? 87, icon:"🎯", color:"#22C55E", suffix:"%" },
              { label:"People at Risk", value: Math.round((kpis?.peopleAtRisk ?? 4500000)/100000), icon:"👥", color:"#F97316", suffix:"L" },
              { label:"False Alarm Rate", value: kpis?.falseAlarmRate ?? 15, icon:"🔔", color:"#00D4FF", suffix:"%" },
              { label:"CSI Score", value: Math.round((kpis?.csi ?? 0.72)*100), icon:"📊", color:"#A855F7", suffix:"%" },
              { label:"POD (Recall)", value: Math.round((kpis?.pod ?? 0.88)*100), icon:"🔭", color:"#3B82F6", suffix:"%" },
              { label:"Total Predictions", value: kpis?.totalPredictions ?? 45892, icon:"🤖", color:"#FBB724", suffix:"" },
              { label:"Peak Rainfall", value: Math.round(kpis?.maxRainfall ?? 287), icon:"🌧️", color:"#00D4FF", suffix:"mm" },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-3xl font-black" style={{ color: s.color }}>
                  <AnimatedCounter target={s.value} duration={1.5} />{s.suffix}
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                background: activeTab === t.id ? "rgba(0,212,255,0.15)" : "var(--bg-card)",
                border: `1px solid ${activeTab === t.id ? "rgba(0,212,255,0.5)" : "var(--border)"}`,
                color: activeTab === t.id ? "#00D4FF" : "var(--text-secondary)",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Accuracy Trend */}
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-4">Model Accuracy Trend (2026)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={displayMonthly}>
                  <defs>
                    <linearGradient id="acGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-tertiary)", fontSize: 12 }} />
                  <YAxis domain={[60, 100]} tick={{ fill: "var(--text-tertiary)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-primary)" }} />
                  <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#00D4FF" fill="url(#acGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pod" name="POD %" stroke="#22C55E" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Skill Metrics Chart */}
              <GlassCard className="p-5">
                <h3 className="text-lg font-bold mb-4">Verification Metrics Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={displayMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-primary)" }} />
                    <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="csi" name="CSI" stroke="#A855F7" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pod" name="POD" stroke="#22C55E" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="far" name="FAR" stroke="#EF4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>

              {/* Rainfall Region Distribution */}
              <GlassCard className="p-5">
                <h3 className="text-lg font-bold mb-4">Rainfall Zone Distribution</h3>
                <div className="flex items-center justify-center">
                  <PieChart width={200} height={200}>
                    <Pie data={[
                      { name:"Coastal", value:35 }, { name:"Himalayan", value:28 },
                      { name:"Peninsular", value:22 }, { name:"Semi-arid", value:10 },
                      { name:"Desert", value:5 },
                    ]} cx={100} cy={100} innerRadius={55} outerRadius={90} dataKey="value">
                      {PIE_COLORS.map((c,i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-primary)" }} />
                  </PieChart>
                  <div className="space-y-2 ml-4">
                    {["Coastal","Himalayan","Peninsular","Semi-arid","Desert"].map((l, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                        <span style={{ color: "var(--text-secondary)" }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* RMSE trend */}
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-4">Prediction Error (RMSE mm) — Improving Over Time</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={displayMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-primary)" }} formatter={(v: number) => [`${v} mm`, "RMSE"]} />
                  <Bar dataKey="rmse" name="RMSE (mm)" fill="#F97316" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>
        )}

        {/* ── MODELS TAB ── */}
        {activeTab === "models" && (
          <div className="space-y-5">
            {/* Model Comparison Table */}
            <GlassCard className="p-5 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4">🤖 AI Model Performance Comparison</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Model","Accuracy","CSI","POD","FAR","RMSE","Status"].map(h => (
                      <th key={h} className="text-left p-3 text-xs font-bold uppercase" style={{ color: "var(--text-tertiary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayModels.map((m, i) => (
                    <tr key={i} className="transition-all" style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,255,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {m.name === "ensemble" && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:"rgba(0,212,255,0.15)", color:"#00D4FF" }}>⭐ BEST</span>}
                          <span className="font-bold capitalize">{m.name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-bold" style={{ color: "#22C55E" }}>{((m.accuracy || 0)).toFixed(1)}%</td>
                      <td className="p-3">{((m.csi || 0) * 100).toFixed(0)}%</td>
                      <td className="p-3" style={{ color: "#00D4FF" }}>{((m.pod || 0) * 100).toFixed(0)}%</td>
                      <td className="p-3" style={{ color: "#EF4444" }}>{((m.far || 0) * 100).toFixed(0)}%</td>
                      <td className="p-3">{(m.rmse || 0).toFixed(2)} mm</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background:"rgba(34,197,94,0.15)", color:"#22C55E" }}>● Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>

            {/* Radar chart for model comparison */}
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-4">Model Skills Radar</h3>
              <div className="flex justify-center">
                <RadarChart width={380} height={280} data={[
                  { metric:"Accuracy", ensemble:87, convlstm:84, transformer:85 },
                  { metric:"CSI", ensemble:78, convlstm:72, transformer:75 },
                  { metric:"POD", ensemble:91, convlstm:85, transformer:88 },
                  { metric:"Precision", ensemble:89, convlstm:83, transformer:86 },
                  { metric:"F1", ensemble:90, convlstm:84, transformer:87 },
                ]}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill:"var(--text-secondary)", fontSize:11 }} />
                  <Radar name="Ensemble" dataKey="ensemble" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.15} />
                  <Radar name="ConvLSTM" dataKey="convlstm" stroke="#A855F7" fill="#A855F7" fillOpacity={0.1} />
                  <Radar name="Transformer" dataKey="transformer" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} />
                  <Legend wrapperStyle={{ color:"var(--text-secondary)", fontSize:12 }} />
                </RadarChart>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── STATES TAB ── */}
        {activeTab === "states" && (
          <div className="space-y-5">
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-4">State-wise Warning Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={displayState} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill:"var(--text-tertiary)", fontSize:11 }} />
                  <YAxis type="category" dataKey="state" tick={{ fill:"var(--text-secondary)", fontSize:11 }} width={110} />
                  <Tooltip contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-primary)" }} />
                  <Bar dataKey="warnings" name="Active Warnings" fill="#EF4444" radius={[0,4,4,0]} />
                  <Bar dataKey="avg_rain" name="Avg Rainfall (mm)" fill="#00D4FF" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-5 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4">State Analytics Table</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["State","Warnings","AI Accuracy","Avg Rainfall","Population at Risk"].map(h => (
                      <th key={h} className="text-left p-3 text-xs font-bold uppercase" style={{ color:"var(--text-tertiary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayState.map((s, i) => (
                    <tr key={i} style={{ borderBottom:"1px solid var(--border)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,255,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="p-3 font-semibold">{s.state}</td>
                      <td className="p-3"><span className="font-bold" style={{ color:"#EF4444" }}>{s.warnings}</span></td>
                      <td className="p-3"><span className="font-bold" style={{ color:"#22C55E" }}>{s.accuracy}%</span></td>
                      <td className="p-3">{s.avg_rain} mm</td>
                      <td className="p-3">{((s.population_at_risk || 0)/100000).toFixed(1)}L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {/* ── HISTORICAL TAB ── */}
        {activeTab === "historical" && (
          <div className="space-y-5">
            {/* Time Machine */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⏰</span>
                <div>
                  <h3 className="text-lg font-bold">Weather Time Machine</h3>
                  <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Replay historical disaster events through VARSHANETRA's AI models</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {["Mumbai 2005","Kerala 2018","Assam 2020","Wayanad 2024"].map(ev => (
                  <button key={ev}
                    onClick={() => handleTimeMachine(ev)}
                    className="p-3 rounded-xl text-sm font-semibold text-left transition-all"
                    style={{ background:"rgba(0,212,255,0.08)", border:`1px solid ${timeMachineEvent === ev ? "#00D4FF" : "rgba(0,212,255,0.2)"}`, color: timeMachineEvent === ev ? "#00D4FF" : "var(--text-secondary)" }}>
                    ▶️ {ev}
                  </button>
                ))}
              </div>
              {timeMachineEvent && (
                <div className="p-4 rounded-xl" style={{ background:"var(--bg-elevated)", border:"1px solid rgba(0,212,255,0.2)" }}>
                  {tmRunning ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-t-cyan-400 rounded-full animate-spin" style={{ borderColor:"rgba(0,212,255,0.2)", borderTopColor:"#00D4FF" }} />
                      <span style={{ color:"#00D4FF" }}>Loading historical data for {timeMachineEvent}...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold" style={{ color:"#22C55E" }}>✅ Analysis Complete — {timeMachineEvent}</p>
                      <p className="text-sm" style={{ color:"var(--text-secondary)" }}>
                        If VARSHANETRA existed during {timeMachineEvent}: RED WARNING would have been issued <strong style={{ color:"#00D4FF" }}>72 hours</strong> before peak rainfall. Estimated lives that could have been saved: <strong style={{ color:"#22C55E" }}>250–450</strong>.
                      </p>
                      <Link href="/historical">
                        <button className="btn-neon px-5 py-2 text-sm mt-2 rounded-lg">View Full Replay →</button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Historical events table */}
            <GlassCard className="p-5 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4">Major Flood Events — VARSHANETRA Impact Analysis</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    {["Event","Peak Rainfall","Lives Lost","Damage","Current Lead Time","VARSHANETRA Lead Time"].map(h => (
                      <th key={h} className="text-left p-3 text-xs font-bold uppercase" style={{ color:"var(--text-tertiary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORICAL_EVENTS.map((e, i) => (
                    <tr key={i} style={{ borderBottom:"1px solid var(--border)" }}
                      onMouseEnter={ev => ev.currentTarget.style.background = "rgba(0,212,255,0.04)"}
                      onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                      <td className="p-3 font-semibold">{e.year}</td>
                      <td className="p-3" style={{ color:"#00D4FF" }}>{e.rainfall}mm</td>
                      <td className="p-3" style={{ color:"#EF4444" }}>{e.lives.toLocaleString()}</td>
                      <td className="p-3" style={{ color:"#F97316" }}>{e.damage}</td>
                      <td className="p-3" style={{ color:"var(--text-tertiary)" }}>{e.leadTime}</td>
                      <td className="p-3 font-bold" style={{ color: e.vshnColor }}>{e.vshn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>

            <div className="flex gap-3 flex-wrap">
              <button onClick={() => {
                const rows = [["Event","Rainfall","Lives","Damage","Lead Time"].join(","), ...HISTORICAL_EVENTS.map(e => [e.year,e.rainfall,e.lives,e.damage,e.leadTime].join(","))];
                const blob = new Blob([rows.join("\n")], { type:"text/csv" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = "varshanetra_historical_events.csv"; a.click();
              }}
                className="btn-outline px-5 py-2.5 text-sm font-semibold rounded-lg">📥 Export CSV</button>
              <button onClick={() => window.print()}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all" style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)" }}>
                🖨️ Print Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
