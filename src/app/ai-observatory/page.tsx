"use client";
import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

const PIPELINE_NODES = [
  { id:"sat",   icon:"🛰️", label:"INSAT-3D", sub:"Satellite", x:0,   y:0, color:"#00D4FF" },
  { id:"rad",   icon:"📡", label:"DWR Radar", sub:"39 stations", x:1,  y:0, color:"#A855F7" },
  { id:"aws",   icon:"🌡️", label:"AWS Grid",  sub:"800+ stations", x:2, y:0, color:"#22C55E" },
  { id:"nwp",   icon:"🧮", label:"GFS/NWP",   sub:"Model data", x:3,  y:0, color:"#FBB724" },
  { id:"fuse",  icon:"⚙️", label:"Data Fusion",sub:"Bayesian OI", x:1.5, y:1, color:"#00D4FF" },
  { id:"conv",  icon:"🧠", label:"ConvLSTM",  sub:"84% acc", x:0,   y:2, color:"#00D4FF" },
  { id:"unet",  icon:"🎯", label:"U-Net",     sub:"82% acc", x:1,   y:2, color:"#22C55E" },
  { id:"trans", icon:"⚡", label:"Transformer",sub:"85% acc", x:2,  y:2, color:"#A855F7" },
  { id:"xgb",   icon:"🌲", label:"XGBoost",   sub:"80% acc", x:3,   y:2, color:"#FBB724" },
  { id:"ens",   icon:"⭐", label:"Ensemble",  sub:"87% acc", x:1.5, y:3, color:"#EF4444" },
  { id:"warn",  icon:"⚠️", label:"Warning",   sub:"Threshold", x:1.5,y:4, color:"#F97316" },
];

const SHAP_FEATURES = [
  { name:"Precipitable Water (850hPa)", contribution:38, dir:"pos", pct:45 },
  { name:"CAPE Instability Index",      contribution:32, dir:"pos", pct:38 },
  { name:"Low-level Convergence",       contribution:28, dir:"pos", pct:33 },
  { name:"Monsoon Trough Proximity",    contribution:22, dir:"pos", pct:26 },
  { name:"Orographic Lifting",          contribution:15, dir:"pos", pct:18 },
  { name:"SST Anomaly (BoB)",           contribution:12, dir:"pos", pct:14 },
  { name:"Time of Day (Afternoon)",     contribution:8,  dir:"neg", pct:10 },
  { name:"Moderate Wind Shear",         contribution:5,  dir:"neg", pct:6  },
];

const PERFORMANCE_METRICS = [
  { month:"Jan", ensemble:87, convlstm:84, transformer:85, unet:82, xgboost:80 },
  { month:"Feb", ensemble:87, convlstm:84, transformer:85, unet:82, xgboost:80 },
  { month:"Mar", ensemble:87.5, convlstm:84.5, transformer:85.5, unet:82.5, xgboost:80.5 },
  { month:"Apr", ensemble:88, convlstm:85, transformer:86, unet:83, xgboost:81 },
  { month:"May", ensemble:88.5, convlstm:85.5, transformer:86.5, unet:83.5, xgboost:81.5 },
  { month:"Jun", ensemble:89, convlstm:86, transformer:87, unet:84, xgboost:82 },
  { month:"Jul", ensemble:90, convlstm:87, transformer:88, unet:85, xgboost:83 },
];

const MODEL_COMPARISON = [
  { name:"ensemble",    csi:0.78, pod:0.91, far:0.11, rmse:3.5, acc:87, inference:"245ms", params:"N/A" },
  { name:"transformer", csi:0.75, pod:0.88, far:0.13, rmse:3.8, acc:85, inference:"92ms",  params:"23.1M" },
  { name:"convlstm",    csi:0.72, pod:0.85, far:0.15, rmse:4.2, acc:84, inference:"87ms",  params:"12.4M" },
  { name:"unet",        csi:0.68, pod:0.82, far:0.18, rmse:5.1, acc:82, inference:"67ms",  params:"3.2M" },
  { name:"xgboost",     csi:0.65, pod:0.80, far:0.22, rmse:6.2, acc:80, inference:"12ms",  params:"450K" },
];

const ENSEMBLE_WEIGHTS = [
  { name:"ConvLSTM", value:30, color:"#00D4FF" },
  { name:"Transformer", value:28, color:"#A855F7" },
  { name:"XGBoost", value:22, color:"#FBB724" },
  { name:"U-Net", value:20, color:"#22C55E" },
];

export default function AIObservatoryPage() {
  const [activeNode, setActiveNode] = useState(0);
  const [activeTab, setActiveTab] = useState<"pipeline"|"models"|"shap"|"performance">("pipeline");
  const [selectedModel, setSelectedModel] = useState("ensemble");
  const [liveMetrics, setLiveMetrics] = useState({ inferences: 45892, accuracy: 87, latency: 89, active: 5 });
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate pipeline nodes
  useEffect(() => {
    const seq = [0,1,2,3,4,5,6,7,8,9,10];
    let idx = 0;
    animRef.current = setInterval(() => {
      setActiveNode(seq[idx % seq.length]);
      idx++;
    }, 600);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  // Simulate live metrics
  useEffect(() => {
    const t = setInterval(() => {
      setLiveMetrics(prev => ({
        inferences: prev.inferences + Math.floor(Math.random() * 3),
        accuracy: 87 + (Math.random() - 0.5) * 0.4,
        latency: 85 + Math.floor(Math.random() * 10),
        active: 5,
      }));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const TABS = [
    { id:"pipeline", label:"⚙️ Live Pipeline" },
    { id:"models",   label:"🤖 Model Comparison" },
    { id:"shap",     label:"🔬 SHAP Explainability" },
    { id:"performance", label:"📈 Performance History" },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="mt-16 max-w-7xl mx-auto p-5 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">🤖 AI Model Observatory</h1>
            <p style={{ color:"var(--text-secondary)" }}>Watch the AI think in real-time — all 5 models, live metrics, explainability</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold" style={{ color:"#22C55E" }}>All 5 Models Active</span>
          </div>
        </div>

        {/* Live KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:"Inferences Today", value: liveMetrics.inferences, icon:"🤖", color:"#00D4FF", fmt: (v: number) => v.toLocaleString() },
            { label:"Ensemble Accuracy", value: liveMetrics.accuracy, icon:"🎯", color:"#22C55E", fmt: (v: number) => `${v.toFixed(1)}%` },
            { label:"Avg Inference Time", value: liveMetrics.latency, icon:"⚡", color:"#FBB724", fmt: (v: number) => `${Math.round(v)}ms` },
            { label:"Active Models", value: liveMetrics.active, icon:"🧠", color:"#A855F7", fmt: (v: number) => `${v}/5` },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs" style={{ color:"var(--text-tertiary)" }}>{s.label}</span>
              </div>
              <div className="text-2xl font-black" style={{ color:s.color }}>{s.fmt(s.value)}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                background: activeTab === t.id ? "rgba(0,212,255,0.15)" : "var(--bg-card)",
                border:`1px solid ${activeTab === t.id ? "rgba(0,212,255,0.5)" : "var(--border)"}`,
                color: activeTab === t.id ? "#00D4FF" : "var(--text-secondary)",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PIPELINE TAB ── */}
        {activeTab === "pipeline" && (
          <div className="space-y-5">
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold mb-6">🔄 Live AI Inference Pipeline</h3>
              {/* Visual pipeline grid */}
              <div className="space-y-6">
                {/* Row 1: Data Sources */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:"var(--text-tertiary)" }}>DATA INGESTION</p>
                  <div className="grid grid-cols-4 gap-3">
                    {PIPELINE_NODES.slice(0,4).map((n, i) => (
                      <div key={n.id} className="p-4 rounded-xl text-center transition-all duration-300"
                        style={{
                          background: activeNode === i ? `${n.color}15` : "var(--bg-card)",
                          border:`1px solid ${activeNode === i ? n.color+"60" : "var(--border)"}`,
                          boxShadow: activeNode === i ? `0 0 20px ${n.color}20` : "none",
                          transform: activeNode === i ? "scale(1.03)" : "scale(1)",
                        }}>
                        <div className="text-3xl mb-2">{n.icon}</div>
                        <p className="text-xs font-bold" style={{ color: activeNode === i ? n.color : "var(--text-primary)" }}>{n.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color:"var(--text-tertiary)" }}>{n.sub}</p>
                        {activeNode === i && <div className="mt-2 w-2 h-2 rounded-full mx-auto animate-pulse" style={{ background:n.color }} />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center" style={{ color:"var(--text-tertiary)" }}>
                  <div className="text-center">
                    <div className="text-2xl animate-bounce">↓</div>
                    <div className="p-3 rounded-xl text-center mt-1" style={{
                      background: activeNode === 4 ? "rgba(0,212,255,0.12)" : "var(--bg-card)",
                      border:`1px solid ${activeNode === 4 ? "rgba(0,212,255,0.4)" : "var(--border)"}`,
                    }}>
                      <span className="text-2xl">⚙️</span>
                      <p className="text-xs font-bold mt-1" style={{ color:"#00D4FF" }}>Data Fusion & Preprocessing</p>
                      <p className="text-[10px]" style={{ color:"var(--text-tertiary)" }}>Bayesian Optimal Interpolation · Quality Control · Feature Engineering</p>
                    </div>
                  </div>
                </div>

                {/* Row 2: Models */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:"var(--text-tertiary)" }}>PARALLEL INFERENCE</p>
                  <div className="grid grid-cols-4 gap-3">
                    {PIPELINE_NODES.slice(5,9).map((n, i) => (
                      <div key={n.id} className="p-4 rounded-xl text-center transition-all duration-300"
                        style={{
                          background: activeNode === i+5 ? `${n.color}15` : "var(--bg-card)",
                          border:`1px solid ${activeNode === i+5 ? n.color+"60" : "var(--border)"}`,
                          transform: activeNode === i+5 ? "scale(1.03)" : "scale(1)",
                        }}>
                        <div className="text-3xl mb-2">{n.icon}</div>
                        <p className="text-xs font-bold" style={{ color: activeNode === i+5 ? n.color : "var(--text-primary)" }}>{n.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color:"var(--text-tertiary)" }}>{n.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ensemble & Warning */}
                <div className="grid grid-cols-2 gap-4">
                  {[PIPELINE_NODES[9], PIPELINE_NODES[10]].map((n, i) => (
                    <div key={n.id} className="p-4 rounded-xl text-center transition-all duration-300"
                      style={{
                        background: activeNode === i+9 ? `${n.color}15` : "var(--bg-card)",
                        border:`1px solid ${activeNode === i+9 ? n.color+"60" : "var(--border)"}`,
                        transform: activeNode === i+9 ? "scale(1.03)" : "scale(1)",
                      }}>
                      <div className="text-3xl mb-2">{n.icon}</div>
                      <p className="text-sm font-bold" style={{ color: activeNode === i+9 ? n.color : "var(--text-primary)" }}>{n.label}</p>
                      <p className="text-xs mt-0.5" style={{ color:"var(--text-tertiary)" }}>{n.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Ensemble Weights */}
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-4">⭐ Dynamic Ensemble Weights</h3>
              <p className="text-sm mb-4" style={{ color:"var(--text-secondary)" }}>
                Weights adapt based on season, region, and recent performance. Current: Monsoon season, Western India.
              </p>
              <div className="space-y-3">
                {ENSEMBLE_WEIGHTS.map(w => (
                  <div key={w.name} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-semibold flex-shrink-0">{w.name}</div>
                    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background:"var(--bg-elevated)" }}>
                      <div className="h-full rounded-full flex items-center px-2 text-[10px] font-bold text-white"
                        style={{ width:`${w.value * 2}%`, background:`linear-gradient(90deg,${w.color},${w.color}CC)`, transition:"width 1s ease" }}>
                        {w.value}%
                      </div>
                    </div>
                    <div className="w-12 text-sm font-bold text-right" style={{ color:w.color }}>{w.value}%</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── MODEL COMPARISON TAB ── */}
        {activeTab === "models" && (
          <div className="space-y-5">
            <GlassCard className="p-5 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4">Model Performance Leaderboard</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    {["Model","Accuracy","CSI","POD","FAR","RMSE","Latency","Params"].map(h => (
                      <th key={h} className="text-left p-3 text-xs font-bold uppercase" style={{ color:"var(--text-tertiary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODEL_COMPARISON.map((m, i) => (
                    <tr key={m.name}
                      className="transition-all cursor-pointer"
                      style={{ borderBottom:"1px solid var(--border)", background: selectedModel === m.name ? "rgba(0,212,255,0.06)" : "transparent" }}
                      onClick={() => setSelectedModel(m.name)}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,255,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = selectedModel === m.name ? "rgba(0,212,255,0.06)" : "transparent"}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {m.name === "ensemble" && <span className="text-xs px-2 py-0.5 rounded-full font-black" style={{ background:"rgba(0,212,255,0.15)", color:"#00D4FF" }}>⭐ BEST</span>}
                          <span className="font-bold capitalize">{m.name}</span>
                          {i === 0 && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                        </div>
                      </td>
                      <td className="p-3 font-black" style={{ color:"#22C55E" }}>{m.acc}%</td>
                      <td className="p-3">{(m.csi*100).toFixed(0)}%</td>
                      <td className="p-3" style={{ color:"#00D4FF" }}>{(m.pod*100).toFixed(0)}%</td>
                      <td className="p-3" style={{ color:"#EF4444" }}>{(m.far*100).toFixed(0)}%</td>
                      <td className="p-3">{m.rmse} mm</td>
                      <td className="p-3 font-mono text-xs">{m.inference}</td>
                      <td className="p-3 text-xs" style={{ color:"var(--text-tertiary)" }}>{m.params}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>

            {/* Radar Chart */}
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-4">Skills Radar — All Models</h3>
              <div className="flex justify-center">
                <RadarChart width={400} height={280} data={[
                  { metric:"Accuracy", ensemble:90, convlstm:84, transformer:85 },
                  { metric:"CSI",      ensemble:78, convlstm:72, transformer:75 },
                  { metric:"POD",      ensemble:91, convlstm:85, transformer:88 },
                  { metric:"Low FAR",  ensemble:89, convlstm:85, transformer:87 },
                  { metric:"Speed",    ensemble:50, convlstm:70, transformer:65 },
                  { metric:"R²",       ensemble:95, convlstm:91, transformer:93 },
                ]}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
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

        {/* ── SHAP TAB ── */}
        {activeTab === "shap" && (
          <div className="space-y-5">
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-2">🔬 SHAP Explainability — Why Does the AI Predict Heavy Rain?</h3>
              <p className="text-sm mb-5" style={{ color:"var(--text-secondary)" }}>
                SHAP (SHapley Additive exPlanations) values show exactly which atmospheric features drove the current prediction.
                Base value: 45mm → Final prediction: 215mm (Mumbai example)
              </p>

              {/* Waterfall */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl text-sm" style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
                  <span style={{ color:"var(--text-tertiary)" }}>Base value (climatological mean)</span>
                  <span className="font-black" style={{ color:"#00D4FF" }}>45mm</span>
                </div>
                {SHAP_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-52 text-xs truncate flex-shrink-0" style={{ color:"var(--text-secondary)" }}>
                      {i+1}. {f.name}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 rounded overflow-hidden relative" style={{ background:"var(--bg-card)" }}>
                        <div className="absolute inset-y-0 left-0 flex items-center px-2 text-[11px] font-black text-white rounded transition-all duration-700"
                          style={{
                            width:`${f.pct}%`,
                            background: f.dir==="pos" ? "linear-gradient(90deg,#22C55E,#16A34A)" : "linear-gradient(90deg,#EF4444,#DC2626)",
                            minWidth:"50px",
                          }}>
                          {f.dir==="pos" ? "+" : "−"}{f.contribution}mm
                        </div>
                      </div>
                    </div>
                    <div className="w-12 text-xs font-bold text-right flex-shrink-0" style={{ color: f.dir==="pos" ? "#22C55E" : "#EF4444" }}>
                      {f.dir==="pos" ? "▲" : "▼"} {f.contribution}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-xl text-sm font-black" style={{ background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.3)" }}>
                  <span>Final Prediction (Ensemble)</span>
                  <span style={{ color:"#00D4FF" }}>215mm — RED WARNING ✅</span>
                </div>
              </div>
            </GlassCard>

            {/* Feature Importance Bar Chart */}
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-4">Feature Importance (Absolute SHAP Values)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SHAP_FEATURES.map(f => ({ name:f.name.split(" ")[0], value:f.contribution, dir:f.dir }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill:"var(--text-tertiary)", fontSize:11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill:"var(--text-secondary)", fontSize:10 }} width={90} />
                  <Tooltip contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-primary)" }} formatter={(v: number) => [`${v}mm`, "SHAP Impact"]} />
                  <Bar dataKey="value" radius={[0,4,4,0]}
                    fill="#00D4FF"
                    label={{ position:"right", fill:"var(--text-tertiary)", fontSize:10 }} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>
        )}

        {/* ── PERFORMANCE HISTORY TAB ── */}
        {activeTab === "performance" && (
          <div className="space-y-5">
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-4">Model Accuracy Over Time (2026)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={PERFORMANCE_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill:"var(--text-tertiary)", fontSize:12 }} />
                  <YAxis domain={[78,92]} tick={{ fill:"var(--text-tertiary)", fontSize:12 }} />
                  <Tooltip contentStyle={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text-primary)" }} />
                  <Legend wrapperStyle={{ color:"var(--text-secondary)", fontSize:12 }} />
                  <Line type="monotone" dataKey="ensemble"    name="Ensemble"    stroke="#00D4FF" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="transformer" name="Transformer" stroke="#A855F7" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="convlstm"    name="ConvLSTM"    stroke="#22C55E" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="unet"        name="U-Net"       stroke="#FBB724" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="xgboost"     name="XGBoost"     stroke="#EF4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Verification Scorecard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { metric:"CSI Score", value:"0.78", sub:"Industry best > 0.6", color:"#00D4FF" },
                { metric:"POD (Recall)", value:"91%", sub:"Catches 9/10 events", color:"#22C55E" },
                { metric:"FAR", value:"11%", sub:"Only 11% false alarms", color:"#FBB724" },
                { metric:"RMSE", value:"3.5mm", sub:"Per 24h forecast", color:"#A855F7" },
              ].map(s => (
                <GlassCard key={s.metric} className="p-5 text-center">
                  <p className="text-xs mb-2" style={{ color:"var(--text-tertiary)" }}>{s.metric}</p>
                  <p className="text-3xl font-black" style={{ color:s.color }}>{s.value}</p>
                  <p className="text-xs mt-2" style={{ color:"var(--text-tertiary)" }}>{s.sub}</p>
                </GlassCard>
              ))}
            </div>

            {/* Learning Curve */}
            <GlassCard className="p-5">
              <h3 className="text-lg font-bold mb-2">📚 Model Improvement Trajectory</h3>
              <p className="text-sm mb-4" style={{ color:"var(--text-secondary)" }}>
                Ensemble accuracy has improved from 72% to 90% over 7 months of continuous learning from new observations.
              </p>
              <div className="p-4 rounded-xl" style={{ background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-sm font-bold" style={{ color:"#22C55E" }}>✅ Model continuously improves as new monsoon data arrives</p>
                <p className="text-sm mt-1" style={{ color:"var(--text-secondary)" }}>
                  Every 24h: 785 new AWS observations, 288 radar scans, 96 satellite passes → retraining scheduled weekly
                </p>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
