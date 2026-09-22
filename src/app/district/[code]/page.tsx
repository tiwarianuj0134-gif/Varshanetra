"use client";
import { useEffect, useState, use } from "react";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { WarningBadge } from "@/components/ui/WarningBadge";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { getWarningBg, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar
} from "recharts";

interface DistrictData {
  district: { code: string; name: string; state: string };
  warning: { warningLevel: string; expectedRainfallMm: number; populationAtRisk: number; affectedAreaKm2: number; impactSummary: Record<string, string | number>; validUntil: string } | null;
  current: { rainfallMm: number; rainfallRate: number; humidity: number; temperature: number; rainfall24h: number; category: string };
  predictions: { forecastHorizon: number; predictedRainfallMm: number; confidenceScore: number; modelName?: string }[];
  modelComparison: { modelName: string; predictedRainfallMm: number; confidenceScore: number }[];
  forecastSeries: { label: string; observed: number | null; predicted: number | null; upper: number | null; lower: number | null }[];
  riskZones: { zoneName: string; riskLevel: string; estimatedDepthM: number; affectedPopulation: number; rainfallThresholdMm: number }[];
  shapValues: { name: string; contribution: number; direction: string }[];
  dataWeights: { satellite: number; radar: number; station: number; nwp: number };
  impact: Record<string, string | number>;
}

export default function DistrictPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<DistrictData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/district/${code}`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="text-5xl mb-4 animate-spin">⚙️</div><p className="text-sky-600 font-bold">Loading district data...</p></div></div>;
  if (!data || data.district.name === code) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-600">District not found</p></div>;

  const forecastChartData = data.forecastSeries?.slice(20, 60) || [];
  const modelData = data.modelComparison?.map(m => ({ name: m.modelName.toUpperCase(), rainfall: Math.round(m.predictedRainfallMm), confidence: Math.round(m.confidenceScore * 100) })) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mt-16 max-w-7xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
          <span>›</span>
          <Link href="/warnings" className="hover:text-cyan-400 transition-colors">Warnings</Link>
          <span>›</span>
          <span className="text-white">{data.district.name}</span>
        </div>

        {/* SECTION 1: Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black">{data.district.name}</h1>
            <p className="text-gray-400 mt-1">{data.district.state} · District Deep Dive Analysis</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {data.warning && <WarningBadge level={data.warning.warningLevel} size="lg" />}
            {(user?.userType === "government" || user?.userType === "admin") && (
              <Link href={`/bulletin?district=${code}`}>
                <button className="btn-neon px-5 py-2.5 rounded-xl font-bold text-sm">📋 Generate Bulletin</button>
              </Link>
            )}
            <Link href={`/inundation?district=${code}`}>
              <button className="px-5 py-2.5 rounded-xl border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 transition-all font-bold text-sm">🌊 Flood Simulator</button>
            </Link>
          </div>
        </div>

        {/* SECTION 2: Warning Card */}
        {data.warning && (
          <GlassCard className={`p-6 border-l-4 ${data.warning.warningLevel==="RED"?"border-red-500 bg-red-500/5":data.warning.warningLevel==="ORANGE"?"border-orange-500 bg-orange-500/5":"border-yellow-500 bg-yellow-500/5"}`}>
            <div className="flex flex-wrap gap-6 items-center">
              <div><p className="text-sm text-gray-400 mb-1">Expected Rainfall</p><p className={`text-4xl font-black ${data.warning.warningLevel==="RED"?"text-red-400":data.warning.warningLevel==="ORANGE"?"text-orange-400":"text-yellow-400"}`}>{Math.round(data.warning.expectedRainfallMm)}mm <span className="text-lg text-gray-500">/ 24h</span></p></div>
              <div><p className="text-sm text-gray-400 mb-1">Population at Risk</p><p className="text-4xl font-black text-red-300">{formatNumber(data.warning.populationAtRisk || 0)}</p></div>
              <div><p className="text-sm text-gray-400 mb-1">Affected Area</p><p className="text-4xl font-black text-orange-300">{data.warning.affectedAreaKm2?.toFixed(0) || 0} km²</p></div>
              <div><p className="text-sm text-gray-400 mb-1">Valid Until</p><p className="text-lg font-bold text-white">{new Date(data.warning.validUntil).toLocaleString("en-IN")}</p></div>
            </div>
            {data.warning.impactSummary && (
              <div className="mt-4 pt-4 border-t border-white/8 flex flex-wrap gap-4 text-sm">
                {Object.entries(data.warning.impactSummary).filter(([k]) => ["roadDisruption","railService","cropDamage","landslideRisk"].includes(k)).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-gray-500">{k==="roadDisruption"?"🛣️ Road":k==="railService"?"🚂 Rail":k==="cropDamage"?"🌾 Crop":"⛰️ Landslide"}:</span>
                    <span className={String(v).includes("Severe")||String(v).includes("High")||String(v).includes("cancelled")?"text-red-400":"text-yellow-400"}>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* SECTION 3: Current Conditions */}
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {[
            { label:"Rain Rate", value:`${data.current.rainfallRate?.toFixed(1)||0}`, unit:"mm/hr", color:"text-cyan-400" },
            { label:"24h Total", value:`${Math.round(data.current.rainfall24h||0)}`, unit:"mm", color:"text-blue-400" },
            { label:"Current", value:`${Math.round(data.current.rainfallMm||0)}`, unit:"mm", color:"text-purple-400" },
            { label:"Humidity", value:`${Math.round(data.current.humidity||0)}`, unit:"%", color:"text-teal-400" },
            { label:"Temperature", value:`${Math.round(data.current.temperature||0)}`, unit:"°C", color:"text-orange-400" },
            { label:"Category", value:data.current.category, unit:"", color:"text-white" },
          ].map((m, i) => (
            <GlassCard key={i} className="p-4 text-center">
              <p className={`text-2xl font-black ${m.color}`}>{m.value}<span className="text-sm">{m.unit}</span></p>
              <p className="text-xs text-gray-500 mt-1">{m.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* SECTION 4 & 5: Forecast Chart + Model Comparison */}
        <div className="grid grid-cols-3 gap-6">
          <GlassCard className="col-span-2 p-5">
            <h2 className="font-black text-lg mb-4">📈 72-Hour AI Forecast</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={forecastChartData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fontSize:9, fill:"#555" }} interval={7} />
                <YAxis tick={{ fontSize:9, fill:"#555" }} />
                <Tooltip contentStyle={{ background:"#0A1628", border:"1px solid rgba(0,212,255,0.3)", borderRadius:"8px", fontSize:"11px" }} />
                <Area dataKey="upper" fill="rgba(59,130,246,0.08)" stroke="none" />
                <Area dataKey="lower" fill="#060E1A" stroke="none" />
                <Area type="monotone" dataKey="predicted" stroke="#00D4FF" fill="url(#predGrad)" strokeWidth={2} strokeDasharray="5 3" name="Predicted" />
                <Area type="monotone" dataKey="observed" stroke="#00FF88" fill="none" strokeWidth={2} name="Observed" />
                {data.warning && <ReferenceLine y={data.warning.expectedRainfallMm * 0.8} stroke="#FF4444" strokeDasharray="4 4" label={{ value:"Threshold", position:"right", fontSize:9, fill:"#FF4444" }} />}
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-black text-lg mb-4">🤖 Model Comparison (24h)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={modelData} layout="vertical" margin={{ top:0, right:10, left:10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fontSize:9, fill:"#555" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:"#94A3B8" }} width={80} />
                <Tooltip contentStyle={{ background:"#0A1628", border:"1px solid rgba(0,212,255,0.3)", borderRadius:"6px", fontSize:"11px" }} />
                <Bar dataKey="rainfall" fill="#00D4FF" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* SECTION 6 & 7: AI Predictions + Data Weights */}
        <div className="grid grid-cols-2 gap-6">
          <GlassCard className="p-5">
            <h2 className="font-black text-lg mb-4">🔮 AI Ensemble Predictions</h2>
            <div className="space-y-3">
              {data.predictions.slice(0, 6).map(p => (
                <div key={p.forecastHorizon} className="flex items-center gap-3 bg-white/4 rounded-xl p-3">
                  <div className="w-16 text-center"><p className="text-xs text-gray-500">Next</p><p className="font-black text-lg text-cyan-400">{p.forecastHorizon}h</p></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1"><span className="text-sm font-bold text-white">{Math.round(p.predictedRainfallMm)}mm</span><span className="text-xs text-green-400">{Math.round(p.confidenceScore*100)}% conf</span></div>
                    <div className="w-full bg-white/8 rounded-full h-2"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width:`${p.confidenceScore*100}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-black text-lg mb-4">🔄 Data Fusion Weights</h2>
            <div className="space-y-4">
              {Object.entries(data.dataWeights).map(([src, w]) => {
                const icons: Record<string, string> = { satellite:"🛰️", radar:"📡", station:"🌡️", nwp:"🖥️" };
                return (
                  <div key={src}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-300">{icons[src] || "📊"} {src.charAt(0).toUpperCase()+src.slice(1)}</span>
                      <span className="text-cyan-400 font-bold">{Math.round((w as number)*100)}%</span>
                    </div>
                    <div className="w-full bg-white/8 rounded-full h-3">
                      <div className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000" style={{ width:`${(w as number)*100}%`, boxShadow:"0 0 8px rgba(0,212,255,0.4)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* SECTION 8: SHAP */}
        <GlassCard className="p-6">
          <h2 className="font-black text-lg mb-2">🔬 Explainable AI — Why This Prediction?</h2>
          <p className="text-sm text-gray-400 mb-5">SHAP values showing which atmospheric factors are driving the forecast</p>
          <div className="space-y-3">
            {data.shapValues.slice(0, 8).map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-52 flex-shrink-0"><p className="text-sm text-gray-300 truncate">{f.name}</p></div>
                <div className="flex-1">
                  <div className="w-full bg-white/8 rounded-full h-6 overflow-hidden">
                    <div className={`h-full rounded-full flex items-center justify-end pr-3 ${f.direction==="positive"?"bg-red-500/70":"bg-blue-500/70"}`}
                      style={{ width:`${(Math.abs(f.contribution)/50)*100}%` }}>
                      <span className="text-xs font-bold text-white">{f.direction==="positive"?"+":""}{f.contribution}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-bold w-6 ${f.direction==="positive"?"text-red-400":"text-blue-400"}`}>{f.direction==="positive"?"▲":"▼"}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/70" /><span>Increases rainfall risk</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500/70" /><span>Reduces rainfall risk</span></div>
          </div>
        </GlassCard>

        {/* SECTION 9: Flood Risk Zones */}
        {data.riskZones.length > 0 && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-lg">🌊 Flood Risk Zones</h2>
              <Link href={`/inundation?district=${code}`}>
                <button className="btn-neon px-4 py-2 rounded-xl text-sm font-bold">Run 3D Simulation →</button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {data.riskZones.map((z, i) => (
                <div key={i} className={`p-4 rounded-xl border ${z.riskLevel==="high"?"border-red-500/40 bg-red-500/5":z.riskLevel==="medium"?"border-orange-500/40 bg-orange-500/5":"border-yellow-500/30 bg-yellow-500/5"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-white">{z.zoneName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold border ${z.riskLevel==="high"?"bg-red-500/20 text-red-400 border-red-500/40":z.riskLevel==="medium"?"bg-orange-500/20 text-orange-400 border-orange-500/40":"bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>{z.riskLevel.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-gray-500">Max Depth</p><p className="font-bold text-cyan-400">{z.estimatedDepthM?.toFixed(1)}m</p></div>
                    <div><p className="text-gray-500">Population</p><p className="font-bold text-orange-400">{formatNumber(z.affectedPopulation||0)}</p></div>
                    <div><p className="text-gray-500">Threshold</p><p className="font-bold text-yellow-400">{z.rainfallThresholdMm}mm</p></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* SECTION 10: Actions */}
        <div className="flex flex-wrap gap-4">
          <Link href={`/inundation?district=${code}`}><button className="btn-neon px-6 py-3 rounded-xl font-bold">🌊 3D Flood Simulator</button></Link>
          <Link href="/map"><button className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition-all font-bold">🗺️ View on Map</button></Link>
          {(user?.userType === "government" || user?.userType === "admin") && <Link href={`/bulletin?district=${code}`}><button className="px-6 py-3 rounded-xl border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 transition-all font-bold">📋 Generate Bulletin</button></Link>}
          <Link href="/analytics"><button className="px-6 py-3 rounded-xl border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 transition-all font-bold">📈 Analytics</button></Link>
        </div>
      </div>
    </div>
  );
}
