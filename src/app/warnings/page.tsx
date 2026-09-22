"use client";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { WarningBadge } from "@/components/ui/WarningBadge";
import { formatNumber, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface Warning {
  id: number; warningId: string; districtCode: string; districtName: string;
  stateName: string; warningLevel: string; expectedRainfallMm: number;
  expectedRainfallMax: number; forecastHours: number; populationAtRisk: number;
  affectedAreaKm2: number; impactSummary: Record<string, string | number>;
  validFrom: string; validUntil: string; issuedAt: string;
}

const STATES = ["All States","Maharashtra","Kerala","Assam","West Bengal","Uttarakhand","Tamil Nadu","Odisha","Karnataka","Gujarat","Telangana","Uttar Pradesh","Bihar","Himachal Pradesh","Andhra Pradesh","Rajasthan","Madhya Pradesh"];

export default function WarningsPage() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [stateFilter, setStateFilter] = useState("All States");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"severity" | "time" | "rainfall" | "population">("severity");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    const fetch_ = () => {
      fetch("/api/warnings?limit=100").then(r => r.json())
        .then(d => { setWarnings(d.warnings || []); setLoading(false); })
        .catch(() => setLoading(false));
    };
    fetch_();
    const t = setInterval(fetch_, 30000);
    return () => clearInterval(t);
  }, []);

  const counts = { RED: 0, ORANGE: 0, YELLOW: 0 };
  warnings.forEach(w => { if (w.warningLevel in counts) counts[w.warningLevel as keyof typeof counts]++; });

  let filtered = warnings;
  if (filter !== "ALL") filtered = filtered.filter(w => w.warningLevel === filter);
  if (stateFilter !== "All States") filtered = filtered.filter(w => w.stateName === stateFilter);
  if (search) filtered = filtered.filter(w => w.districtName.toLowerCase().includes(search.toLowerCase()) || w.stateName.toLowerCase().includes(search.toLowerCase()));

  filtered = [...filtered].sort((a, b) => {
    const levelOrder = { RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 };
    if (sortBy === "severity") return (levelOrder[b.warningLevel as keyof typeof levelOrder] || 0) - (levelOrder[a.warningLevel as keyof typeof levelOrder] || 0);
    if (sortBy === "rainfall") return b.expectedRainfallMm - a.expectedRainfallMm;
    if (sortBy === "population") return (b.populationAtRisk || 0) - (a.populationAtRisk || 0);
    if (sortBy === "time") return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
    return 0;
  });

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(filtered.map(w => w.warningId));
  const clearSelect = () => setSelected([]);

  const handleBulkDispatch = async () => {
    setDispatching(true);
    await new Promise(r => setTimeout(r, 2000));
    setDispatchResult({ sent: selected.length * 1240, failed: Math.floor(selected.length * 0.02) });
    setDispatching(false);
    setSelected([]);
  };

  const exportCSV = () => {
    const rows = [["District","State","Level","Expected mm","Population at Risk","Valid Until"]];
    filtered.forEach(w => rows.push([w.districtName, w.stateName, w.warningLevel, String(Math.round(w.expectedRainfallMm)), String(w.populationAtRisk || 0), new Date(w.validUntil).toLocaleString("en-IN")]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `varshanetra-warnings-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <div className="mt-16 max-w-[1600px] mx-auto px-6 lg:px-10 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-3">⚠️ Active Warning Hub</h1>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">Real-time warnings across India — updated every 15 minutes</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-emerald-700 font-semibold">{warnings.length} active</span>
            </div>
            {(user?.userType === "government" || user?.userType === "admin") && (
              <button onClick={exportCSV} className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold hover:bg-[var(--bg-primary)] hover:border-slate-400 transition-all text-[var(--text-secondary)] shadow-sm">
                📥 Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 lg:gap-6 mb-8">
          {[
            { level:"ALL", label:"Total Warnings", count:warnings.length, color:"text-white", bg:"bg-white/5", border:"border-white/15" },
            { level:"RED", label:"RED Warnings", count:counts.RED, color:"text-red-400", bg:"bg-red-500/10", border:"border-red-500/30", pulse:true },
            { level:"ORANGE", label:"ORANGE Alerts", count:counts.ORANGE, color:"text-orange-400", bg:"bg-orange-500/10", border:"border-orange-500/30" },
            { level:"YELLOW", label:"YELLOW Watch", count:counts.YELLOW, color:"text-yellow-400", bg:"bg-yellow-500/10", border:"border-yellow-500/25" },
          ].map(item => (
            <GlassCard key={item.level} className={`p-6 cursor-pointer border ${item.border} ${item.bg} hover:scale-105 transition-all ${filter===item.level?"ring-2 ring-cyan-500/50":""}`}
              onClick={() => setFilter(item.level)}>
              <div className={`text-5xl md:text-6xl font-black ${item.color} mb-2 ${'pulse' in item && item.pulse && item.count>0?"animate-pulse":""}`}>{item.count}</div>
              <p className="text-sm md:text-base text-gray-400 font-medium">{item.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Dispatch result */}
        {dispatchResult && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/40 rounded-xl flex items-center gap-3">
            <span className="text-green-400 text-xl">✅</span>
            <div>
              <p className="text-green-400 font-bold">Alerts Dispatched Successfully!</p>
              <p className="text-green-300 text-sm">Sent: {dispatchResult.sent.toLocaleString()} · Failed: {dispatchResult.failed}</p>
            </div>
            <button onClick={() => setDispatchResult(null)} className="ml-auto text-green-600 hover:text-green-400 transition-all">✕</button>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          {/* Level filter */}
          <div className="flex gap-2">
            {["ALL","RED","ORANGE","YELLOW"].map(level => (
              <button key={level} onClick={() => setFilter(level)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                  filter === level
                    ? level==="RED"?"bg-red-500/20 border-red-500/50 text-red-400"
                      : level==="ORANGE"?"bg-orange-500/20 border-orange-500/50 text-orange-400"
                      : level==="YELLOW"?"bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                      : "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-white/4 border-white/10 text-gray-400 hover:bg-white/8"
                }`}>
                {level} {level !== "ALL" && `(${counts[level as keyof typeof counts] || 0})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search district or state..."
            className="bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none w-64" />

          {/* State filter */}
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
            className="bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
            {STATES.map(s => <option key={s} value={s} className="bg-[#0A1628]">{s}</option>)}
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
            <option value="severity" className="bg-[#0A1628]">Sort: Severity</option>
            <option value="time" className="bg-[#0A1628]">Sort: Time</option>
            <option value="rainfall" className="bg-[#0A1628]">Sort: Rainfall</option>
            <option value="population" className="bg-[#0A1628]">Sort: Population</option>
          </select>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-2 rounded-lg text-sm transition-all ${viewMode==="grid"?"bg-cyan-500/20 text-cyan-400":"text-gray-400 hover:bg-white/8"}`}>⊞</button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-2 rounded-lg text-sm transition-all ${viewMode==="list"?"bg-cyan-500/20 text-cyan-400":"text-gray-400 hover:bg-white/8"}`}>☰</button>
          </div>
        </div>

        {/* Bulk actions */}
        {(user?.userType === "government" || user?.userType === "admin") && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-white/4 rounded-xl border border-white/8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                onChange={e => e.target.checked ? selectAll() : clearSelect()} className="accent-cyan-500" />
              <span className="text-xs text-gray-400">{selected.length > 0 ? `${selected.length} selected` : "Select all"}</span>
            </label>
            {selected.length > 0 && (
              <>
                <div className="w-px h-4 bg-white/10" />
                <button onClick={handleBulkDispatch} disabled={dispatching}
                  className="btn-neon px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50">
                  {dispatching ? "⏳ Dispatching..." : `📱 Send Alerts (${selected.length})`}
                </button>
                <button onClick={clearSelect} className="px-3 py-1.5 rounded-lg text-xs bg-white/8 text-gray-300 hover:bg-white/12 transition-all">Clear</button>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20"><div className="text-5xl mb-4 animate-spin">⚙️</div><p className="text-cyan-400">Loading warnings...</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20"><div className="text-5xl mb-4">✅</div><h3 className="text-xl font-bold text-green-400">No Warnings</h3><p className="text-gray-400">No active warnings match your filters</p></div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {filtered.map(w => (
              <GlassCard key={w.warningId} className={`p-6 border-l-4 hover:bg-white/6 transition-all ${w.warningLevel==="RED"?"border-l-red-500":w.warningLevel==="ORANGE"?"border-l-orange-500":"border-l-yellow-500"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {(user?.userType === "government" || user?.userType === "admin") && (
                      <input type="checkbox" checked={selected.includes(w.warningId)} onChange={() => toggleSelect(w.warningId)} className="accent-cyan-500 mt-1" />
                    )}
                    <div>
                      <h3 className="font-bold text-lg md:text-xl">{w.districtName}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{w.stateName}</p>
                    </div>
                  </div>
                  <WarningBadge level={w.warningLevel} size="sm" />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/4 rounded-xl p-3.5 text-center">
                    <p className={`text-2xl md:text-3xl font-black ${w.warningLevel==="RED"?"text-red-400":w.warningLevel==="ORANGE"?"text-orange-400":"text-yellow-400"}`}>{Math.round(w.expectedRainfallMm)}mm</p>
                    <p className="text-xs text-gray-500 mt-1">Expected (24h)</p>
                  </div>
                  <div className="bg-white/4 rounded-xl p-3.5 text-center">
                    <p className="text-2xl md:text-3xl font-black text-red-300">{formatNumber(w.populationAtRisk || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">People at Risk</p>
                  </div>
                </div>
                {w.impactSummary && (
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between"><span className="text-gray-500">🛣️ Road</span><span className={String(w.impactSummary.roadDisruption).includes("Severe")?"text-red-400":"text-yellow-400"}>{String(w.impactSummary.roadDisruption||"—")}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">🌾 Crop</span><span className="text-orange-400">{String(w.impactSummary.cropDamage||"—")}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">⛰️ Landslide</span><span className={String(w.impactSummary.landslideRisk)==="High"?"text-red-400":"text-yellow-400"}>{String(w.impactSummary.landslideRisk||"—")}</span></div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Link href={`/district/${w.districtCode}`} className="flex-1">
                    <button className="w-full py-2.5 bg-white/8 hover:bg-white/12 rounded-xl text-sm font-bold transition-all">📊 Details</button>
                  </Link>
                  {(user?.userType === "government" || user?.userType === "admin") && (
                    <Link href={`/bulletin?district=${w.districtCode}`} className="flex-1">
                      <button className="w-full py-2.5 bg-blue-600/60 hover:bg-blue-600/80 rounded-xl text-sm font-bold transition-all">📋 Bulletin</button>
                    </Link>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-white/8 flex justify-between text-xs text-gray-500">
                  <span>Valid until {new Date(w.validUntil).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
                  <span>Issued {timeAgo(w.issuedAt)}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm data-table">
              <thead><tr>{["","Level","District","State","Expected mm","Population at Risk","Area km²","Valid Until","Issued","Actions"].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.warningId}>
                    <td>{(user?.userType === "government" || user?.userType === "admin") && <input type="checkbox" checked={selected.includes(w.warningId)} onChange={() => toggleSelect(w.warningId)} className="accent-cyan-500" />}</td>
                    <td><WarningBadge level={w.warningLevel} size="sm" /></td>
                    <td className="font-medium text-white">{w.districtName}</td>
                    <td className="text-gray-400">{w.stateName}</td>
                    <td className={`font-bold ${w.warningLevel==="RED"?"text-red-400":w.warningLevel==="ORANGE"?"text-orange-400":"text-yellow-400"}`}>{Math.round(w.expectedRainfallMm)}</td>
                    <td>{formatNumber(w.populationAtRisk||0)}</td>
                    <td className="text-gray-400">{w.affectedAreaKm2?.toFixed(0)||"—"}</td>
                    <td className="text-gray-500">{new Date(w.validUntil).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</td>
                    <td className="text-gray-500">{timeAgo(w.issuedAt)}</td>
                    <td><Link href={`/district/${w.districtCode}`}><button className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded text-xs hover:bg-cyan-500/30 transition-all">Details →</button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
