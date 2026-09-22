"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { formatNumber } from "@/lib/utils";
import dynamic from "next/dynamic";

const Terrain3DViewer = dynamic(() => import("@/components/inundation/Terrain3DViewer").then(m => m.Terrain3DViewer), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "var(--bg-base)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>≋</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>Loading 3D Engine…</div>
      </div>
    </div>
  ),
});

/* ── Types ───────────────────────────────────────────────────── */
interface SimResult {
  simulationId: string;
  district: { name: string; state: string; lat: number; lon: number };
  inputs: { rainfallMm: number; durationHours: number; intensityMmPerHr: number };
  results: { maxWaterDepthM: number; affectedAreaKm2: number; populationAtRisk: number; buildingsAffected: number; roadsSubmergedKm: number; runoffCoefficient: number; soilSaturation: number };
  riskZones: { name: string; risk: string; depthM: number; areaKm2: number; population: number }[];
  timeSeriesData: { hour: number; waterDepthM: number; dangerLevel: number }[];
  modelInfo: { type: string; baseModel: string; aiComponent: string; confidence: number };
}

const SCENARIOS = [
  { label: "Moderate",     rain: 65,  hours: 24, severity: "yellow" },
  { label: "Heavy",        rain: 115, hours: 24, severity: "orange" },
  { label: "Very Heavy",   rain: 200, hours: 24, severity: "red"    },
  { label: "Extreme",      rain: 400, hours: 24, severity: "red"    },
  { label: "Mumbai 2005",  rain: 944, hours: 24, severity: "purple" },
  { label: "Kerala 2018",  rain: 550, hours: 48, severity: "blue"   },
];

const SEVERITY_COLOR: Record<string, string> = {
  yellow: "var(--yellow)", orange: "var(--orange)",
  red: "var(--red)", purple: "var(--purple)", blue: "var(--blue)",
};

const EVAC_ROUTES = [
  { name: "Route A — Northern Bypass",  distance: "12.4 km", status: "CLEAR",   color: "var(--green)"  },
  { name: "Route B — Eastern Corridor", distance: "8.2 km",  status: "CAUTION", color: "var(--yellow)" },
  { name: "Route C — Southern Bridge",  distance: "6.8 km",  status: "FLOODED", color: "var(--red)"    },
];

/* ═════════════════════════════════════════════════════════════ */
function InundationContent() {
  const params = useSearchParams();
  const [districtCode, setDistrictCode]     = useState(params.get("district") || "MH-MUM");
  const [rainfallMm,   setRainfallMm]       = useState(150);
  const [durationHours, setDurationHours]   = useState(24);
  const [simulating,   setSimulating]       = useState(false);
  const [progress,     setProgress]         = useState(0);
  const [result,       setResult]           = useState<SimResult | null>(null);
  const [playTime,     setPlayTime]         = useState(0);
  const [isPlaying,    setIsPlaying]        = useState(false);
  const [activeTab,    setActiveTab]        = useState<"3d" | "results" | "evacuation">("3d");

  const runSimulation = async () => {
    setSimulating(true); setProgress(0); setResult(null); setPlayTime(0); setIsPlaying(false);
    const pi = setInterval(() => setProgress(p => { if (p >= 95) { clearInterval(pi); return 95; } return p + Math.random() * 12; }), 250);
    try {
      const res = await fetch("/api/inundation/simulate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districtCode, rainfallMm, durationHours }),
      });
      const d = await res.json();
      clearInterval(pi); setProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setResult(d);
      setActiveTab("results");
    } catch { clearInterval(pi); }
    setSimulating(false);
  };

  useEffect(() => {
    if (!isPlaying || !result) return;
    const t = setInterval(() => setPlayTime(p => {
      if (p >= result.inputs.durationHours) { setIsPlaying(false); return result.inputs.durationHours; }
      return p + 1;
    }), 200);
    return () => clearInterval(t);
  }, [isPlaying, result]);

  const selectedDistrict = INDIAN_DISTRICTS.find(d => d.code === districtCode);
  const currentWater = result?.timeSeriesData[Math.min(playTime, (result?.timeSeriesData?.length || 1) - 1)]?.waterDepthM || 0;
  const maxDepth = result?.results.maxWaterDepthM || 0;

  const panel = { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" } as const;
  const sectionLabel = { fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 as const, letterSpacing: "0.10em" as const, textTransform: "uppercase" as const, color: "var(--text-muted)" } as const;

  return (
    <AppShell>
      <div style={{ height: "calc(100dvh - 84px)", display: "flex", overflow: "hidden" }}>

        {/* ── LEFT CONTROLS ────────────────────────────────── */}
        <aside style={{ width: 260, flexShrink: 0, background: "var(--bg-surface)", borderRight: "1px solid var(--border)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }} className="scrollbar-none">

          {/* Header */}
          <div style={{ padding: "16px 16px 12px" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>≋</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: 4 }}>3D Inundation Simulator</h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>Physics-informed flood impact simulation</p>
            <span className="badge-demo" style={{ marginTop: 8, display: "inline-flex" }}>MODEL SIMULATION</span>
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* District */}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>District</div>
            <select value={districtCode} onChange={e => setDistrictCode(e.target.value)}
              style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 13, padding: "8px 10px", width: "100%", outline: "none" }}>
              {INDIAN_DISTRICTS.map(d => (
                <option key={d.code} value={d.code}>{d.name} — {d.state}</option>
              ))}
            </select>
            {selectedDistrict && (
              <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)" }}>
                {selectedDistrict.lat.toFixed(3)}°N {selectedDistrict.lon.toFixed(3)}°E · Pop: {formatNumber(selectedDistrict.pop)}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* Rainfall input */}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Rainfall Input</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Precipitation</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", fontWeight: 700, color: "var(--cyan)" }}>{rainfallMm}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>mm</span></span>
            </div>
            <input type="range" min={10} max={1000} step={5} value={rainfallMm} onChange={e => setRainfallMm(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--cyan)", margin: "0 0 4px" }}/>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)" }}>
              <span>10mm</span><span>1000mm</span>
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Duration</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--blue)" }}>{durationHours}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>h</span></span>
            </div>
            <input type="range" min={3} max={120} step={3} value={durationHours} onChange={e => setDurationHours(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--blue)" }}/>
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* Scenarios */}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Quick Scenarios</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {SCENARIOS.map(s => (
                <button key={s.label} onClick={() => { setRainfallMm(s.rain); setDurationHours(s.hours); }}
                  style={{
                    padding: "7px 10px", borderRadius: "var(--r-sm)", textAlign: "left", cursor: "pointer",
                    background: "var(--bg-panel)", border: `1px solid ${SEVERITY_COLOR[s.severity]}40`,
                    color: SEVERITY_COLOR[s.severity], fontSize: 12, fontWeight: 500,
                    transition: "all 150ms", width: "100%", fontFamily: "var(--font-body)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                  <span>{s.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.7 }}>{s.rain}mm/{s.hours}h</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)" }}/>

          {/* Run button */}
          <div style={{ padding: "14px 16px" }}>
            <button onClick={runSimulation} disabled={simulating} className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", fontFamily: "var(--font-body)" }}>
              {simulating ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(7,11,20,0.3)", borderTopColor: "var(--text-on-accent)", animation: "spin-slow 0.8s linear infinite" }}/>
                  Simulating… {Math.round(progress)}%
                </span>
              ) : "≋ Run Simulation"}
            </button>
            {simulating && (
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }}/>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER — VISUALIZATION ────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", background: "var(--bg-surface)", padding: "0 16px", flexShrink: 0 }}>
            {(["3d", "results", "evacuation"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 16px", background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === tab ? "var(--cyan)" : "transparent"}`,
                  color: activeTab === tab ? "var(--cyan)" : "var(--text-muted)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 150ms",
                  fontFamily: "var(--font-body)", letterSpacing: "0.02em", textTransform: "capitalize",
                  marginBottom: -1,
                }}>
                {tab === "3d" ? "3D Terrain" : tab === "results" ? "Impact Results" : "Evacuation Routes"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>

            {/* 3D Viewer */}
            {activeTab === "3d" && (
              <div style={{ height: "100%", position: "relative" }}>
                <Terrain3DViewer
                  district={selectedDistrict || null}
                  waterDepth={result ? currentWater : 0}
                  floodDepth={result ? currentWater : 0}
                  districtName={selectedDistrict?.name || "Mumbai"}
                  isBreached={false}
                />
                {/* Overlay chips */}
                <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8, flexDirection: "column", zIndex: 10 }}>
                  <div style={{ ...panel, padding: "8px 12px", backdropFilter: "blur(8px)" }}>
                    <div style={{ ...sectionLabel, marginBottom: 4 }}>Selected District</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{selectedDistrict?.name || "—"}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>{selectedDistrict?.state}</div>
                  </div>
                  {result && (
                    <div style={{ ...panel, padding: "8px 12px", background: "rgba(239,68,68,0.12)", borderColor: "var(--red-border)", backdropFilter: "blur(8px)" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--red-bright)", fontWeight: 600, marginBottom: 3 }}>SIMULATED FLOOD DEPTH</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--red)" }}>
                        {currentWater.toFixed(2)}<span style={{ fontSize: 12, color: "var(--text-muted)" }}>m</span>
                      </div>
                      <span className="badge-demo" style={{ marginTop: 5 }}>MODEL ESTIMATE</span>
                    </div>
                  )}
                </div>

                {/* Playback */}
                {result && (
                  <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", ...panel, padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(12px)", zIndex: 10 }}>
                    <button onClick={() => setIsPlaying(p => !p)} className="btn btn-primary btn-sm" style={{ fontFamily: "var(--font-body)" }}>
                      {isPlaying ? "⏸ Pause" : "▶ Play"}
                    </button>
                    <input type="range" min={0} max={result.inputs.durationHours} value={playTime} onChange={e => setPlayTime(Number(e.target.value))}
                      style={{ width: 160, accentColor: "var(--cyan)" }}/>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)", minWidth: 40 }}>+{playTime}h</span>
                  </div>
                )}

                {!result && !simulating && (
                  <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", ...panel, padding: "12px 20px", textAlign: "center", backdropFilter: "blur(12px)" }}>
                    <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Configure inputs and click <strong style={{ color: "var(--cyan)" }}>Run Simulation</strong></div>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {activeTab === "results" && (
              <div style={{ height: "100%", overflowY: "auto", padding: "16px" }} className="scrollbar-none">
                {!result ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>≋</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>No simulation run yet</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Configure parameters and click Run Simulation</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 800 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        Simulation Results — {result.district.name}
                      </h3>
                      <span className="badge-demo">MODEL SIMULATION · NOT REAL-WORLD DATA</span>
                    </div>

                    {/* Impact metrics */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                      {[
                        { label: "Max Flood Depth",    val: `${result.results.maxWaterDepthM.toFixed(2)}m`, color: "var(--red)" },
                        { label: "Affected Area",       val: `${result.results.affectedAreaKm2.toFixed(1)} km²`, color: "var(--orange)" },
                        { label: "Population at Risk",  val: formatNumber(result.results.populationAtRisk), color: "var(--yellow)" },
                        { label: "Model Confidence",    val: `${Math.round(result.modelInfo.confidence * 100)}%`, color: "var(--cyan)" },
                      ].map((m, i) => (
                        <div key={i} style={{ ...panel, padding: "14px", borderTop: `3px solid ${m.color}` }}>
                          <div style={{ ...sectionLabel, marginBottom: 5 }}>{m.label}</div>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: m.color }}>{m.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Time series */}
                    <div style={{ ...panel, padding: "14px 16px" }}>
                      <div style={{ ...sectionLabel, marginBottom: 12 }}>Simulated Water Level Timeline</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={result.timeSeriesData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" vertical={false}/>
                          <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} tickFormatter={v => `+${v}h`} axisLine={false} tickLine={false}/>
                          <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false}/>
                          <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-accent)", borderRadius: "var(--r-md)", fontFamily: "var(--font-body)", fontSize: 12 }}/>
                          <ReferenceLine y={result.timeSeriesData[0]?.dangerLevel || 1} stroke="var(--red)" strokeDasharray="4 3" strokeWidth={1}/>
                          <Area dataKey="waterDepthM" fill="rgba(6,182,212,0.12)" stroke="var(--cyan)" strokeWidth={2} name="Water Depth (m)"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Risk zones */}
                    {result.riskZones?.length > 0 && (
                      <div style={{ ...panel, overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", ...sectionLabel }}>Risk Zones</div>
                        <table className="data-table">
                          <thead>
                            <tr>{["Zone", "Risk Level", "Depth", "Area", "Population"].map(h => <th key={h}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {result.riskZones.map((z, i) => {
                              const rc = { critical: "var(--red)", high: "var(--orange)", medium: "var(--yellow)", low: "var(--green)" }[z.risk] || "var(--text-muted)";
                              return (
                                <tr key={i}>
                                  <td style={{ fontWeight: 500 }}>{z.name}</td>
                                  <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: rc, textTransform: "uppercase" }}>{z.risk}</span></td>
                                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{z.depthM?.toFixed(1)}m</td>
                                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{z.areaKm2?.toFixed(1)} km²</td>
                                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatNumber(z.population)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Model info */}
                    <div style={{ ...panel, padding: "12px 16px", display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Model Type</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{result.modelInfo.type}</div>
                      </div>
                      <div>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>AI Component</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{result.modelInfo.aiComponent}</div>
                      </div>
                      <div>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Inputs</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>
                          {result.inputs.rainfallMm}mm / {result.inputs.durationHours}h
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        <CircularProgress value={Math.round(result.modelInfo.confidence * 100)} size={52} label="Conf"/>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-dim)", fontStyle: "italic", textAlign: "center" }}>
                      All values are model-estimated simulation outputs, not real-world measurements.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Evacuation */}
            {activeTab === "evacuation" && (
              <div style={{ height: "100%", overflowY: "auto", padding: "16px" }} className="scrollbar-none">
                <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 600 }}>Evacuation Route Analysis</h3>
                    <span className="badge-demo">DEMO / SIMULATED</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {EVAC_ROUTES.map((r, i) => (
                      <div key={i} style={{ ...panel, padding: "16px", borderLeft: `3px solid ${r.color}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{r.name}</div>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{r.distance}</div>
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: r.color, padding: "2px 8px", borderRadius: "var(--r-full)", background: r.color + "15", border: `1px solid ${r.color}30` }}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ ...panel, padding: "14px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Emergency Contact:</strong> Dial <strong style={{ color: "var(--red)", fontFamily: "var(--font-mono)" }}>112</strong> for immediate assistance.
                    Evacuation routes are model-estimated — verify with local authorities before use.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function InundationPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100dvh - 84px)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>≋</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em" }}>LOADING SIMULATOR</div>
          </div>
        </div>
      </AppShell>
    }>
      <InundationContent />
    </Suspense>
  );
}
