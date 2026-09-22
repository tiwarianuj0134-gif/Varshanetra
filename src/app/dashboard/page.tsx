"use client";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { WarningBadge } from "@/components/ui/WarningBadge";
import { CircularProgress } from "@/components/ui/CircularProgress";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line,
} from "recharts";
import { getWarningColor, formatNumber, timeAgo } from "@/lib/utils";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { useAuth } from "@/lib/auth-context";
import { KisanDashboard } from "@/components/dashboard/KisanDashboard";

/* ── Types ───────────────────────────────────────────────────── */
interface Warning {
  warningId: string; districtCode: string; districtName: string;
  stateName: string; warningLevel: string; expectedRainfallMm: number;
  populationAtRisk: number; affectedAreaKm2: number;
  impactSummary: Record<string, string | number>; validUntil: string; issuedAt: string;
}
interface OverviewData {
  warnings: { RED: number; ORANGE: number; YELLOW: number; total: number };
  statistics: {
    peopleAtRisk: number; maxRainfall24h: number; hotspot: string;
    activeStations: number; totalStations: number; modelAccuracy: number;
    predictionsToday: number; systemUptime: number;
  };
  topStations: { stationName: string; stateName: string; rainfall24h: number; currentRainfall: number; humidity: number; isActive: boolean }[];
}
interface DistrictDetail {
  district: { code: string; name: string; state: string };
  warning: Warning | null;
  current: { rainfallMm: number; rainfallRate: number; humidity: number; temperature: number; rainfall24h: number; category: string };
  predictions: { forecastHorizon: number; predictedRainfallMm: number; confidenceScore: number }[];
  forecastSeries: { label: string; observed: number | null; predicted: number | null; upper: number | null; lower: number | null }[];
  riskZones: { zoneName: string; riskLevel: string; estimatedDepthM: number; affectedPopulation: number }[];
  shapValues: { name: string; contribution: number; direction: string }[];
  dataWeights: { satellite: number; radar: number; station: number; nwp: number };
  impact: Record<string, string | number>;
}

const LAYERS = [
  { id: "rainfall",   label: "Rainfall" },
  { id: "radar",      label: "Radar" },
  { id: "satellite",  label: "Satellite IR" },
  { id: "inundation", label: "Flood Risk" },
  { id: "warnings",   label: "Warning Zones" },
  { id: "stations",   label: "AWS Stations" },
  { id: "terrain",    label: "DEM Terrain" },
  { id: "population", label: "Population" },
];

const SOURCE_LABELS: Record<string, string> = {
  fused: "Fused (Best)", satellite: "INSAT-3DR", radar: "Doppler Radar",
  station: "AWS Network", nwp: "NWP Model",
};
const SOURCES = ["fused", "satellite", "radar", "station", "nwp"] as const;
type Source = typeof SOURCES[number];

/* ── Tooltip wrapper ─────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: {color: string; name: string; value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-accent)", borderRadius: "var(--r-md)", padding: "8px 12px", fontFamily: "var(--font-body)", fontSize: 12 }}>
      <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value?.toFixed(1)}mm</div>
      ))}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"expert" | "kisan">("expert");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [districtDetail, setDistrictDetail] = useState<DistrictDetail | null>(null);
  const [activeSource, setActiveSource] = useState<Source>("fused");
  const [activeLayers, setActiveLayers] = useState<string[]>(["rainfall", "warnings", "stations"]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [timeMode, setTimeMode] = useState<"past" | "live" | "forecast">("live");

  /* view mode from user type */
  useEffect(() => {
    if (user?.userType === "public") setViewMode("kisan");
    else setViewMode("expert");
  }, [user]);

  /* data fetch */
  const fetchOverview = useCallback(async () => {
    try {
      const [ovRes, warnRes] = await Promise.all([
        fetch("/api/dashboard/overview"),
        fetch("/api/warnings?limit=50"),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (warnRes.ok) { const d = await warnRes.json(); setWarnings(d.warnings || []); }
      setLastUpdate(new Date());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOverview();
    const t = setInterval(fetchOverview, 30000);
    return () => clearInterval(t);
  }, [fetchOverview]);

  useEffect(() => {
    if (!selectedDistrict) return;
    setDetailLoading(true);
    fetch(`/api/district/${selectedDistrict}`)
      .then(r => r.json()).then(setDistrictDetail)
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [selectedDistrict]);

  const toggleLayer = (id: string) =>
    setActiveLayers(p => p.includes(id) ? p.filter(l => l !== id) : [...p, id]);

  const stats = overview?.statistics;
  const topStationData = (overview?.topStations || []).slice(0, 8).map(s => ({
    name: s.stationName.replace(" AWS","").slice(0, 10),
    rainfall: s.rainfall24h || 0,
  }));
  const forecastData = districtDetail?.forecastSeries?.slice(24, 48) || [];
  const redWarnings = warnings.filter(w => w.warningLevel === "RED");

  /* ── Styles ─────────────────────────────────────────────── */
  const panel = { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" } as const;
  const sectionLabel = { fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 as const, letterSpacing: "0.10em" as const, textTransform: "uppercase" as const, color: "var(--text-muted)" } as const;

  /* ── KISAN VIEW ─────────────────────────────────────────── */
  if (!loading && viewMode === "kisan") {
    return (
      <AppShell>
        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={() => setViewMode("expert")} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
              ◎ Switch to Expert View
            </button>
          </div>
          <KisanDashboard userDistrict={user?.districtName} onSwitchToExpert={() => setViewMode("expert")} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ height: "calc(100dvh - 84px)", display: "flex", overflow: "hidden" }}>

        {/* ══ LEFT SIDEBAR ════════════════════════════════════ */}
        <aside style={{ width: 232, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto", background: "var(--bg-surface)", display: "flex", flexDirection: "column", gap: 0 }} className="scrollbar-none hide-tablet">

          {/* Warning summary */}
          <div style={{ padding: "14px 14px 10px" }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Active Threats</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { level: "RED",    count: overview?.warnings.RED || 0,    color: "var(--red)",    bg: "var(--red-bg)",    border: "var(--red-border)" },
                { level: "ORANGE", count: overview?.warnings.ORANGE || 0, color: "var(--orange)", bg: "var(--orange-bg)", border: "var(--orange-border)" },
                { level: "YELLOW", count: overview?.warnings.YELLOW || 0, color: "var(--yellow)", bg: "var(--yellow-bg)", border: "var(--yellow-border)" },
              ].map(item => (
                <div key={item.level} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: "var(--r-md)",
                  background: item.bg, border: `1px solid ${item.border}`,
                  animation: item.level === "RED" && item.count > 0 ? "severity-glow-red 2.5s infinite" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {item.count > 0 && <span className="live-dot" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}/>}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: "0.06em" }}>{item.level}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* Data sources */}
          <div style={{ padding: "12px 14px" }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Data Source</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {SOURCES.map(src => (
                <button key={src} onClick={() => setActiveSource(src)}
                  style={{
                    padding: "7px 10px", borderRadius: "var(--r-sm)", textAlign: "left",
                    background: activeSource === src ? "var(--cyan-glow-sm)" : "transparent",
                    border: `1px solid ${activeSource === src ? "var(--border-accent)" : "transparent"}`,
                    color: activeSource === src ? "var(--cyan)" : "var(--text-muted)",
                    cursor: "pointer", fontSize: 12, fontWeight: activeSource === src ? 600 : 400,
                    transition: "all 150ms", width: "100%", fontFamily: "var(--font-body)",
                  }}>
                  {SOURCE_LABELS[src]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* Map layers */}
          <div style={{ padding: "12px 14px" }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Map Layers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {LAYERS.map(layer => {
                const on = activeLayers.includes(layer.id);
                return (
                  <label key={layer.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: "var(--r-sm)", cursor: "pointer", background: on ? "rgba(6,182,212,0.05)" : "transparent" }}>
                    <input type="checkbox" checked={on} onChange={() => toggleLayer(layer.id)} style={{ accentColor: "var(--cyan)", width: 13, height: 13, margin: 0 }}/>
                    <span style={{ fontSize: 12, color: on ? "var(--cyan)" : "var(--text-muted)", fontWeight: on ? 500 : 400, transition: "color 150ms" }}>{layer.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* Time control */}
          <div style={{ padding: "12px 14px" }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Time Mode</div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["past","live","forecast"] as const).map(m => (
                <button key={m} onClick={() => setTimeMode(m)}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: "var(--r-sm)",
                    background: timeMode === m ? "var(--cyan-glow-sm)" : "transparent",
                    border: `1px solid ${timeMode === m ? "var(--border-accent)" : "var(--border)"}`,
                    color: timeMode === m ? "var(--cyan)" : "var(--text-muted)",
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase",
                    transition: "all 150ms",
                  }}>
                  {m === "live" ? "● LIVE" : m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* Active warnings list */}
          <div style={{ padding: "12px 14px", flex: 1, minHeight: 0 }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Warning List</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 280, overflowY: "auto" }} className="scrollbar-none">
              {warnings.slice(0, 20).map(w => {
                const wc = getWarningColor(w.warningLevel);
                const active = selectedDistrict === w.districtCode;
                return (
                  <button key={w.warningId} onClick={() => setSelectedDistrict(w.districtCode)}
                    style={{
                      padding: "7px 8px", borderRadius: "var(--r-sm)", textAlign: "left",
                      background: active ? "var(--cyan-glow-sm)" : "transparent",
                      border: `1px solid ${active ? "var(--border-accent)" : "transparent"}`,
                      cursor: "pointer", width: "100%", transition: "all 150ms",
                      fontFamily: "var(--font-body)",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: wc, flexShrink: 0, display: "inline-block" }}/>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.districtName}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 2, paddingLeft: 12 }}>
                      {w.stateName} · {Math.round(w.expectedRainfallMm)}mm
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* Quick links */}
          <div style={{ padding: "12px 14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {[
                { href: "/map",         label: "Live Map" },
                { href: "/inundation",  label: "3D Flood" },
                { href: "/chat",        label: "VARSHA AI" },
                { href: "/community",   label: "Reports" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  style={{ padding: "6px 8px", borderRadius: "var(--r-sm)", background: "var(--bg-panel)", border: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)", textDecoration: "none", textAlign: "center", transition: "all 150ms", fontWeight: 500, display: "block" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)"; (e.currentTarget as HTMLElement).style.color = "var(--cyan)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
            <button onClick={() => setViewMode("kisan")} className="btn btn-secondary btn-sm" style={{ width: "100%", fontSize: 11 }}>
              🌾 Switch to Kisan View
            </button>
          </div>
        </aside>

        {/* ══ CENTER — MAIN CONTENT ════════════════════════════ */}
        <main style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14, background: "var(--bg-base)", minWidth: 0 }} className="scrollbar-none">

          {/* Stats row */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: "var(--r-lg)" }}/>)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { label: "Active Warnings",  value: overview?.warnings.total || 0,  suffix: "",   accent: "var(--orange)", sub: `${overview?.warnings.RED||0} RED · ${overview?.warnings.ORANGE||0} ORANGE` },
                { label: "People at Risk",   value: stats?.peopleAtRisk || 0,        suffix: "",   accent: "var(--red)",    sub: "Across warning zones" },
                { label: "Peak Rainfall 24h",value: stats?.maxRainfall24h || 0,      suffix: "mm", accent: "var(--cyan)",   sub: stats?.hotspot || "Top district" },
                { label: "AI Confidence",    value: stats?.modelAccuracy || 87,      suffix: "%",  accent: "var(--green)",  sub: `${stats?.predictionsToday || 0} predictions today` },
              ].map((s, i) => (
                <div key={i} style={{ ...panel, padding: "14px 16px", borderLeft: `3px solid ${s.accent}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ ...sectionLabel }}>{s.label}</div>
                    <span className="badge-demo">DEMO</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: s.accent, letterSpacing: "-0.03em", lineHeight: 1 }}>
                    <AnimatedCounter target={s.value} duration={1.2} />{s.suffix}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 5 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Top rainfall stations */}
            <div style={{ ...panel, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ ...sectionLabel }}>Top Rainfall Stations (24h)</div>
                <span className="badge-live">Live</span>
              </div>
              {topStationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={topStationData} margin={{ top: 0, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <ReferenceLine y={115.5} stroke="var(--orange)" strokeDasharray="4 3" strokeWidth={1}/>
                    <ReferenceLine y={204.5} stroke="var(--red)" strokeDasharray="4 3" strokeWidth={1}/>
                    <Bar dataKey="rainfall" fill="var(--cyan)" radius={[3,3,0,0]} opacity={0.85} name="Rainfall"/>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="skeleton" style={{ height: 160, borderRadius: "var(--r-md)" }}/>
              )}
            </div>

            {/* Warning distribution */}
            <div style={{ ...panel, padding: "14px 16px" }}>
              <div style={{ ...sectionLabel, marginBottom: 14 }}>Warning Distribution</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { level: "RED",    value: overview?.warnings.RED || 0,    total: overview?.warnings.total || 1, color: "var(--red)" },
                  { level: "ORANGE", value: overview?.warnings.ORANGE || 0, total: overview?.warnings.total || 1, color: "var(--orange)" },
                  { level: "YELLOW", value: overview?.warnings.YELLOW || 0, total: overview?.warnings.total || 1, color: "var(--yellow)" },
                ].map(w => {
                  const pct = Math.min(100, (w.value / Math.max(1, w.total)) * 100);
                  return (
                    <div key={w.level}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: w.color, fontWeight: 600 }}>{w.level}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-primary)", fontWeight: 700 }}>{w.value}</span>
                      </div>
                      <div className="confidence-bar-track">
                        <div className="confidence-bar-fill" style={{ width: `${pct}%`, background: w.color }}/>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...sectionLabel }}>Model Confidence</span>
                  <CircularProgress value={stats?.modelAccuracy || 87} size={52} label="AI"/>
                </div>
              </div>
            </div>
          </div>

          {/* District access */}
          <div style={{ ...panel, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ ...sectionLabel }}>Quick District Access</div>
              <Link href="/map" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--cyan)", textDecoration: "none" }}>Full Map →</Link>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {INDIAN_DISTRICTS.slice(0, 16).map(d => {
                const hasWarning = warnings.find(w => w.districtCode === d.code);
                return (
                  <button key={d.code} onClick={() => setSelectedDistrict(d.code)}
                    style={{
                      padding: "5px 10px", borderRadius: "var(--r-sm)",
                      background: selectedDistrict === d.code ? "var(--cyan-glow-sm)" : "var(--bg-surface)",
                      border: `1px solid ${selectedDistrict === d.code ? "var(--border-accent)" : hasWarning ? getWarningColor(hasWarning.warningLevel) + "40" : "var(--border)"}`,
                      fontSize: 11, color: selectedDistrict === d.code ? "var(--cyan)" : "var(--text-secondary)",
                      cursor: "pointer", transition: "all 150ms", fontFamily: "var(--font-body)",
                    }}>
                    {hasWarning && <span style={{ color: getWarningColor(hasWarning.warningLevel), marginRight: 4, fontSize: 9 }}>●</span>}
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warnings table */}
          <div style={{ ...panel, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ ...sectionLabel }}>Active Warnings — All Districts</div>
              <Link href="/warnings" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--cyan)", textDecoration: "none" }}>View All →</Link>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    {["Level","District","State","Rainfall","Population at Risk","Area km²","Valid Until",""].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {warnings.slice(0, 10).map(w => (
                    <tr key={w.warningId} style={{ cursor: "pointer" }}
                      onClick={() => setSelectedDistrict(w.districtCode)}>
                      <td><WarningBadge level={w.warningLevel} size="sm"/></td>
                      <td style={{ fontWeight: 600 }}>{w.districtName}</td>
                      <td style={{ color: "var(--text-muted)" }}>{w.stateName}</td>
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: getWarningColor(w.warningLevel) }}>
                          {Math.round(w.expectedRainfallMm)}mm
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatNumber(w.populationAtRisk || 0)}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{w.affectedAreaKm2?.toFixed(0) || "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                        {new Date(w.validUntil).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>Details →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* System info footer */}
            <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 16, alignItems: "center", background: "var(--bg-surface)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
                Stations: {stats?.activeStations || 785}/{stats?.totalStations || 800} online
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
                Updated: {timeAgo(lastUpdate)}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
                Uptime: {stats?.systemUptime || 99.97}%
              </span>
              <span className="badge-demo">DEMO DATA</span>
            </div>
          </div>
        </main>

        {/* ══ RIGHT PANEL — INTELLIGENCE ══════════════════════ */}
        <aside style={{ width: 288, flexShrink: 0, borderLeft: "1px solid var(--border)", overflowY: "auto", background: "var(--bg-surface)", display: "flex", flexDirection: "column" }} className="scrollbar-none hide-tablet">
          {selectedDistrict && districtDetail ? (
            /* ── District Detail ── */
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{districtDetail.district.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{districtDetail.district.state}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  {districtDetail.warning && <WarningBadge level={districtDetail.warning.warningLevel} size="sm"/>}
                  <button onClick={() => setSelectedDistrict(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>✕ Close</button>
                </div>
              </div>

              {/* Current conditions */}
              <div className="intel-panel">
                <div className="intel-panel-header"><span className="intel-panel-header title">Current Conditions</span><span className="badge-live">Live</span></div>
                <div className="intel-panel-body">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Rain Rate", val: `${districtDetail.current.rainfallRate?.toFixed(1) || 0}`, unit: "mm/hr", color: "var(--cyan)" },
                      { label: "24h Total", val: `${Math.round(districtDetail.current.rainfall24h || 0)}`, unit: "mm", color: "var(--blue)" },
                      { label: "Humidity",  val: `${Math.round(districtDetail.current.humidity || 0)}`, unit: "%", color: "var(--purple)" },
                      { label: "Temp",      val: `${Math.round(districtDetail.current.temperature || 0)}`, unit: "°C", color: "var(--orange)" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "var(--bg-base)", borderRadius: "var(--r-sm)", padding: "8px 10px", textAlign: "center", border: "1px solid var(--border)" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: m.color, lineHeight: 1 }}>
                          {m.val}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-muted)" }}>{m.unit}</span>
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Forecast */}
              <div className="intel-panel">
                <div className="intel-panel-header"><span className="intel-panel-header title">AI Forecast</span><span className="badge-model">Model</span></div>
                <div className="intel-panel-body" style={{ padding: "10px 14px" }}>
                  {districtDetail.predictions.slice(0, 5).map(p => (
                    <div key={p.forecastHorizon} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>+{p.forecastHorizon}h</span>
                      <div style={{ flex: 1, margin: "0 12px" }}>
                        <div className="confidence-bar-track">
                          <div className="confidence-bar-fill" style={{ width: `${Math.min(100, (p.predictedRainfallMm / 300) * 100)}%` }}/>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{Math.round(p.predictedRainfallMm)}mm</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--green)" }}>{Math.round(p.confidenceScore * 100)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forecast chart */}
              {forecastData.length > 0 && (
                <div className="intel-panel">
                  <div className="intel-panel-header"><span className="intel-panel-header title">72h Forecast</span></div>
                  <div style={{ padding: "10px 8px" }}>
                    <ResponsiveContainer width="100%" height={100}>
                      <ComposedChart data={forecastData.slice(0, 20)} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false}/>
                        <XAxis dataKey="label" tick={{ fontSize: 8, fill: "var(--text-dim)" }} interval={5} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fontSize: 8, fill: "var(--text-dim)" }} axisLine={false} tickLine={false}/>
                        <Area dataKey="upper" fill="rgba(59,130,246,0.06)" stroke="none"/>
                        <Area dataKey="lower" fill="var(--bg-base)" stroke="none"/>
                        <Line dataKey="predicted" stroke="var(--cyan)" strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* XAI — SHAP Values */}
              {districtDetail.shapValues?.length > 0 && (
                <div className="intel-panel">
                  <div className="intel-panel-header">
                    <span className="intel-panel-header title">Explainable AI</span>
                    <span className="badge-model">SHAP</span>
                  </div>
                  <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {districtDetail.shapValues.slice(0, 5).map((f, i) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: f.direction === "positive" ? "var(--red)" : "var(--blue)" }}>
                            {f.direction === "positive" ? "+" : ""}{f.contribution}
                          </span>
                        </div>
                        <div className="confidence-bar-track">
                          <div className="shap-bar" style={{ width: `${Math.min(100, (Math.abs(f.contribution) / 50) * 100)}%`, background: f.direction === "positive" ? "var(--red)" : "var(--blue)" }}/>
                        </div>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4, fontStyle: "italic" }}>Model-estimated contributions — demo values</p>
                  </div>
                </div>
              )}

              {/* Data fusion weights */}
              {districtDetail.dataWeights && (
                <div className="intel-panel">
                  <div className="intel-panel-header"><span className="intel-panel-header title">Data Fusion Weights</span></div>
                  <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                    {Object.entries(districtDetail.dataWeights).map(([src, weight]) => (
                      <div key={src}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize" }}>{src}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--cyan)" }}>{Math.round((weight as number) * 100)}%</span>
                        </div>
                        <div className="confidence-bar-track">
                          <div className="confidence-bar-fill" style={{ width: `${(weight as number) * 100}%` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Link href={`/inundation?district=${selectedDistrict}`} className="btn btn-primary" style={{ textDecoration: "none", justifyContent: "center", fontFamily: "var(--font-body)", fontSize: 12 }}>
                  ≋ Run Flood Simulation
                </Link>
                <Link href={`/district/${selectedDistrict}`} className="btn btn-secondary" style={{ textDecoration: "none", justifyContent: "center", fontFamily: "var(--font-body)", fontSize: 12 }}>
                  Full District Analysis →
                </Link>
              </div>
            </div>
          ) : (
            /* ── National Overview ── */
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ ...sectionLabel }}>National Overview</div>

              {/* Today&apos;s hotspot */}
              <div className="intel-panel" style={{ borderLeft: "3px solid var(--cyan)" }}>
                <div className="intel-panel-body">
                  <div style={{ ...sectionLabel, marginBottom: 5 }}>Peak 24h Hotspot</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--cyan)", lineHeight: 1 }}>
                    {stats?.maxRainfall24h || 287}<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>mm</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)", marginTop: 5 }}>📍 {stats?.hotspot || "Mahabaleshwar, MH"}</div>
                  <span className="badge-demo" style={{ marginTop: 8, display: "inline-flex" }}>DEMO</span>
                </div>
              </div>

              {/* AI system health */}
              <div className="intel-panel">
                <div className="intel-panel-header"><span className="intel-panel-header title">AI System Health</span><span className="badge-live">Operational</span></div>
                <div style={{ padding: "8px 14px 12px" }}>
                  {[
                    { name: "ConvLSTM Nowcast",   load: 67 },
                    { name: "U-Net Radar",         load: 54 },
                    { name: "Transformer 72h",     load: 78 },
                    { name: "Ensemble Fusion",     load: 82 },
                    { name: "Warning Engine",      load: 45 },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="live-dot" style={{ width: 5, height: 5 }}/>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{m.name}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)" }}>RUNNING</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)" }}>{m.load}% load</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent alerts */}
              <div className="intel-panel">
                <div className="intel-panel-header"><span className="intel-panel-header title">Recent Alerts</span></div>
                <div style={{ padding: "6px 14px 12px", display: "flex", flexDirection: "column", gap: 0 }}>
                  {warnings.slice(0, 6).map((w, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => setSelectedDistrict(w.districtCode)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{w.districtName}</span>
                        <WarningBadge level={w.warningLevel} size="sm"/>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                        {w.stateName} · {Math.round(w.expectedRainfallMm)}mm
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { icon: "📡", label: "Stations Online", val: `${stats?.activeStations || 785}/${stats?.totalStations || 800}`, color: "var(--green)" },
                  { icon: "🤖", label: "AI Accuracy",     val: `${stats?.modelAccuracy || 87}%`,                                  color: "var(--cyan)" },
                  { icon: "📱", label: "Alerts Today",    val: formatNumber(stats?.alertsSentToday || 1245),                       color: "var(--blue)" },
                  { icon: "⚡", label: "Uptime",          val: `${stats?.systemUptime || 99.97}%`,                                color: "var(--purple)" },
                ].map((item, i) => (
                  <div key={i} style={{ ...panel, padding: "10px 12px" }}>
                    <div style={{ fontSize: 14, marginBottom: 5 }}>{item.icon}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 700, color: item.color }}>{item.val}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

      </div>
    </AppShell>
  );
}
