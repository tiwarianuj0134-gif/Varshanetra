"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { WarningBadge } from "@/components/ui/WarningBadge";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useAuth } from "@/lib/auth-context";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { formatNumber, getWarningColor } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ── Types ───────────────────────────────────────────────────── */
interface Warning {
  warningId: string; districtCode: string; districtName: string; stateName: string;
  warningLevel: "RED" | "ORANGE" | "YELLOW" | "GREEN"; expectedRainfallMm: number;
  populationAtRisk: number; affectedAreaKm2: number; validUntil: string; issuedAt: string;
}
interface NDRFUnit {
  id: string; name: string; district: string; battalion: string;
  personnel: number; boats: number; status: "deployed" | "standby" | "in-transit"; contact: string;
}
interface DispatchStep { label: string; done: number; total: number; }

const INITIAL_NDRF: NDRFUnit[] = [
  { id: "NDRF-01", name: "5th Battalion Team Alpha",   district: "Mumbai",  battalion: "Pune Base",   personnel: 45, boats: 8,  status: "deployed",   contact: "+91 22 2269 4725" },
  { id: "NDRF-02", name: "5th Battalion Team Bravo",   district: "Thane",   battalion: "Pune Base",   personnel: 40, boats: 6,  status: "deployed",   contact: "+91 22 2534 5678" },
  { id: "NDRF-03", name: "4th Battalion Riverine Unit",district: "Wayanad", battalion: "Arakkonam",   personnel: 50, boats: 10, status: "deployed",   contact: "+91 4936 202 234" },
  { id: "NDRF-04", name: "1st Battalion Flood Relief", district: "Kamrup",  battalion: "Patgaon",     personnel: 35, boats: 6,  status: "deployed",   contact: "+91 361 284 0244" },
  { id: "NDRF-05", name: "8th Battalion Quick Response",district:"Delhi",   battalion: "Ghaziabad",   personnel: 60, boats: 12, status: "standby",    contact: "+91 120 276 6013" },
  { id: "NDRF-06", name: "3rd Battalion Coastal Unit", district: "Puri",    battalion: "Mundali",     personnel: 45, boats: 8,  status: "in-transit", contact: "+91 671 287 9711" },
];

const ACTIVITY_FEED = [
  { time: "15:23", label: "RED warning created · Mumbai · AI 87% conf", type: "alert" },
  { time: "15:20", label: "Bulletin published · Maharashtra Region",     type: "bulletin" },
  { time: "15:18", label: "NDRF Team-7 deployed to Kurla West",          type: "deploy" },
  { time: "15:15", label: "12 shelters activated in Andheri",            type: "shelter" },
  { time: "15:12", label: "Satellite data ingested · 96% quality",       type: "data" },
  { time: "15:10", label: "AI predicted Wayanad RED · Confidence 91%",   type: "ai" },
];

const STATUS_COLOR = { deployed: "var(--green)", standby: "var(--yellow)", "in-transit": "var(--cyan)" };
const STATUS_BG    = { deployed: "var(--green-bg)", standby: "var(--yellow-bg)", "in-transit": "var(--cyan-glow-sm)" };

/* ═════════════════════════════════════════════════════════════ */
export default function GovernmentCommandCenter() {
  const { user } = useAuth();
  const [warnings,          setWarnings]          = useState<Warning[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [selectedDistrict,  setSelectedDistrict]  = useState("MH-MUM");
  const [broadcastLevel,    setBroadcastLevel]    = useState<"RED" | "ORANGE" | "YELLOW">("RED");
  const [alertType,         setAlertType]         = useState("flash_flood");
  const [customMsg,         setCustomMsg]         = useState("");
  const [dispatching,       setDispatching]       = useState(false);
  const [dispatchProgress,  setDispatchProgress]  = useState<DispatchStep[]>([]);
  const [dispatchDone,      setDispatchDone]      = useState(false);
  const [dispatchTotal,     setDispatchTotal]     = useState(0);
  const [ndrfUnits,         setNdrfUnits]         = useState<NDRFUnit[]>(INITIAL_NDRF);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [confirmAction,     setConfirmAction]     = useState<string | null>(null);
  const [activeTab,         setActiveTab]         = useState<"command" | "ndrf" | "shelters" | "activity">("command");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/warnings?limit=50")
      .then(r => r.json())
      .then(d => { setWarnings(d.warnings || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const redAlerts    = warnings.filter(w => w.warningLevel === "RED");
  const orangeAlerts = warnings.filter(w => w.warningLevel === "ORANGE");
  const totalRiskPop = warnings.reduce((a, w) => a + (w.populationAtRisk || 0), 0);
  const selDistrict  = INDIAN_DISTRICTS.find(d => d.code === selectedDistrict);
  const selWarning   = warnings.find(w => w.districtCode === selectedDistrict);

  const startDispatch = async () => {
    if (!confirmAction) { setConfirmAction("broadcast"); return; }
    setConfirmAction(null);
    setDispatching(true); setDispatchDone(false);
    const recipients = selWarning?.populationAtRisk ? Math.round(selWarning.populationAtRisk * 0.3) : 4523;
    setDispatchTotal(recipients);
    const channels = ["SMS Gateway", "WhatsApp API", "Email Dispatch", "Push Notifications"];
    const steps: DispatchStep[] = channels.map(c => ({ label: c, done: 0, total: recipients }));
    setDispatchProgress([...steps]);
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += 200;
      setDispatchProgress(prev => prev.map(s => ({
        ...s, done: Math.min(s.total, Math.round(s.total * Math.min(1, elapsed / 3500))),
      })));
      if (elapsed >= 3800) {
        clearInterval(intervalRef.current!);
        setDispatching(false); setDispatchDone(true);
      }
    }, 200);
  };

  const deployNDRF = (id: string) => {
    if (!confirmAction) { setConfirmAction(`deploy-${id}`); return; }
    setConfirmAction(null);
    setNdrfUnits(prev => prev.map(u => u.id === id ? { ...u, status: "deployed" as const } : u));
  };

  const FORECAST_SERIES = [0, 3, 6, 12, 24, 48, 72].map(h => ({
    h: `+${h}h`,
    rainfall: selWarning ? Math.round(selWarning.expectedRainfallMm * (h === 0 ? 0.1 : h <= 24 ? 1 : 0.7)) : 0,
    confidence: Math.max(50, Math.round(87 - h * 0.2)),
  }));

  /* ── Styles ─────────────────────────────────────────────── */
  const panel = { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" } as const;
  const SL = { fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 as const, letterSpacing: "0.10em" as const, textTransform: "uppercase" as const, color: "var(--text-muted)" };

  const TABS = [
    { id: "command",  label: "Command" },
    { id: "ndrf",     label: "NDRF Resources" },
    { id: "shelters", label: "Shelters" },
    { id: "activity", label: "Activity Log" },
  ] as const;

  return (
    <AppShell>
      <div style={{ height: "calc(100dvh - 84px)", overflowY: "auto" }} className="scrollbar-none">
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 16px 32px" }}>

          {/* ── Page header ────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.1875rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                  Government Emergency Command
                </h1>
                <span className="badge-demo">DEMO</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {user ? `${user.name} · ${user.userType === "government" ? "Government Officer" : user.role}` : "Decision support & resource coordination"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/bulletin" className="btn btn-outline btn-sm" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>
                ◫ Generate Bulletin
              </Link>
              <Link href="/inundation" className="btn btn-secondary btn-sm" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>
                ≋ Flood Simulator
              </Link>
            </div>
          </div>

          {/* ── Top KPI cards ───────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
            {[
              { label: "RED Alerts",        value: redAlerts.length,    accent: "var(--red)",    sub: "Immediate response required", pulse: redAlerts.length > 0 },
              { label: "ORANGE Alerts",     value: orangeAlerts.length, accent: "var(--orange)", sub: "Enhanced monitoring active",   pulse: false },
              { label: "Population at Risk",value: totalRiskPop,        accent: "var(--yellow)", sub: "Across all warning zones",     pulse: false },
              { label: "NDRF Deployed",     value: ndrfUnits.filter(u => u.status === "deployed").length, accent: "var(--green)", sub: "Units currently active", pulse: false },
            ].map((s, i) => (
              <div key={i} style={{ ...panel, padding: "14px 16px", borderLeft: `3px solid ${s.accent}`, animation: s.pulse ? "severity-glow-red 2s infinite" : "none" }}>
                <div style={{ ...SL, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: s.accent, lineHeight: 1, letterSpacing: "-0.03em" }}>
                  {loading ? "—" : <AnimatedCounter target={s.value} duration={1}/>}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 5 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Tabs ────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 18 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "9px 18px", background: "transparent", border: "none",
                  borderBottom: `2px solid ${activeTab === tab.id ? "var(--cyan)" : "transparent"}`,
                  color: activeTab === tab.id ? "var(--cyan)" : "var(--text-muted)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 150ms",
                  fontFamily: "var(--font-body)", marginBottom: -1,
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════
             COMMAND TAB
          ════════════════════════════════════════════════════ */}
          {activeTab === "command" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>

              {/* Left col */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* District selector */}
                <div style={{ ...panel, padding: "16px" }}>
                  <div style={{ ...SL, marginBottom: 10 }}>Target District</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {warnings.slice(0, 12).map(w => (
                      <button key={w.districtCode} onClick={() => setSelectedDistrict(w.districtCode)}
                        style={{
                          padding: "5px 12px", borderRadius: "var(--r-sm)", fontSize: 12,
                          background: selectedDistrict === w.districtCode ? "var(--cyan-glow-sm)" : "var(--bg-surface)",
                          border: `1px solid ${selectedDistrict === w.districtCode ? "var(--border-accent)" : getWarningColor(w.warningLevel) + "40"}`,
                          color: selectedDistrict === w.districtCode ? "var(--cyan)" : getWarningColor(w.warningLevel),
                          cursor: "pointer", transition: "all 150ms", fontFamily: "var(--font-body)", fontWeight: 500,
                        }}>
                        <span style={{ fontSize: 8, marginRight: 4 }}>●</span>
                        {w.districtName}
                      </button>
                    ))}
                  </div>
                  {selWarning && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bg-surface)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ ...SL, marginBottom: 3 }}>District</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{selWarning.districtName}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{selWarning.stateName}</div>
                      </div>
                      <div>
                        <div style={{ ...SL, marginBottom: 3 }}>Alert Level</div>
                        <WarningBadge level={selWarning.warningLevel} size="sm"/>
                      </div>
                      <div>
                        <div style={{ ...SL, marginBottom: 3 }}>Expected Rainfall</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--cyan)" }}>{Math.round(selWarning.expectedRainfallMm)}mm</div>
                      </div>
                      <div>
                        <div style={{ ...SL, marginBottom: 3 }}>Population at Risk</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--orange)" }}>{formatNumber(selWarning.populationAtRisk || 0)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Forecast chart */}
                <div style={{ ...panel, padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ ...SL }}>72-Hour Rainfall Forecast — {selDistrict?.name}</div>
                    <span className="badge-model">AI Model</span>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={FORECAST_SERIES} margin={{ top: 0, right: 8, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" vertical={false}/>
                      <XAxis dataKey="h" tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-accent)", borderRadius: "var(--r-md)", fontFamily: "var(--font-body)", fontSize: 12 }}/>
                      <Area dataKey="rainfall" fill="rgba(6,182,212,0.12)" stroke="var(--cyan)" strokeWidth={2} name="Rainfall (mm)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Broadcast alert */}
                <div style={{ ...panel, padding: "16px" }}>
                  <div style={{ ...SL, marginBottom: 12 }}>Broadcast Emergency Alert</div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    {(["RED", "ORANGE", "YELLOW"] as const).map(lv => (
                      <button key={lv} onClick={() => setBroadcastLevel(lv)}
                        style={{
                          padding: "6px 16px", borderRadius: "var(--r-sm)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: broadcastLevel === lv ? (lv === "RED" ? "var(--red-bg)" : lv === "ORANGE" ? "var(--orange-bg)" : "var(--yellow-bg)") : "transparent",
                          border: `1px solid ${broadcastLevel === lv ? getWarningColor(lv) : "var(--border)"}`,
                          color: broadcastLevel === lv ? getWarningColor(lv) : "var(--text-muted)",
                          transition: "all 150ms", fontFamily: "var(--font-body)",
                        }}>
                        ● {lv}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <select value={alertType} onChange={e => setAlertType(e.target.value)}
                      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 13, padding: "8px 10px", width: "100%" }}>
                      <option value="flash_flood">Flash Flood Warning</option>
                      <option value="evacuation">Evacuation Advisory</option>
                      <option value="shelter">Shelter-in-Place</option>
                      <option value="all_clear">All Clear</option>
                    </select>
                  </div>
                  <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)}
                    placeholder="Optional: Add custom message (leave blank for standard template)…"
                    rows={3}
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 13, padding: "8px 10px", width: "100%", resize: "vertical", outline: "none", marginBottom: 12 }}/>

                  {/* Confirm gate */}
                  {confirmAction === "broadcast" ? (
                    <div style={{ display: "flex", gap: 8, padding: "10px", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: "var(--r-md)", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: "var(--red-bright)", flex: 1 }}>
                        ⚠ Confirm broadcast to {formatNumber(selWarning?.populationAtRisk || 0)} subscribers in {selDistrict?.name}?
                      </span>
                      <button onClick={startDispatch} className="btn btn-danger btn-sm" style={{ fontFamily: "var(--font-body)" }}>Confirm</button>
                      <button onClick={() => setConfirmAction(null)} className="btn btn-secondary btn-sm" style={{ fontFamily: "var(--font-body)" }}>Cancel</button>
                    </div>
                  ) : null}

                  <button onClick={startDispatch} disabled={dispatching}
                    className="btn btn-danger btn-lg"
                    style={{ width: "100%", justifyContent: "center", fontFamily: "var(--font-body)" }}>
                    {dispatching ? "Broadcasting…" : "📡 Broadcast Alert"}
                  </button>

                  {/* Dispatch progress */}
                  {(dispatching || dispatchDone) && dispatchProgress.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      {dispatchDone && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: "var(--r-md)", marginBottom: 10 }}>
                          <span className="live-dot"/>
                          <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                            Broadcast complete — {formatNumber(dispatchTotal)} recipients notified
                          </span>
                          <span className="badge-demo" style={{ marginLeft: "auto" }}>DEMO</span>
                        </div>
                      )}
                      {dispatchProgress.map((s, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.label}</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--cyan)" }}>
                              {formatNumber(s.done)}/{formatNumber(s.total)}
                            </span>
                          </div>
                          <div className="confidence-bar-track">
                            <div className="confidence-bar-fill" style={{ width: `${(s.done / Math.max(1, s.total)) * 100}%` }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action quick buttons */}
                <div style={{ ...panel, padding: "16px" }}>
                  <div style={{ ...SL, marginBottom: 12 }}>Quick Actions</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Deploy NDRF Team",    accent: "var(--blue)",   href: null },
                      { label: "Open Emergency Shelter", accent: "var(--green)", href: null },
                      { label: "Generate Bulletin",   accent: "var(--cyan)",   href: "/bulletin" },
                      { label: "Request Resources",   accent: "var(--orange)", href: null },
                    ].map((a, i) => (
                      a.href ? (
                        <Link key={i} href={a.href} className="btn btn-secondary" style={{ justifyContent: "center", fontSize: 12, textDecoration: "none", fontFamily: "var(--font-body)", borderColor: a.accent + "40", color: a.accent }}>
                          {a.label}
                        </Link>
                      ) : (
                        <button key={i} className="btn btn-secondary" style={{ justifyContent: "center", fontSize: 12, fontFamily: "var(--font-body)", borderColor: a.accent + "40", color: a.accent }}
                          onClick={() => alert("Feature requires live government system integration.")}>
                          {a.label}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Right col — intelligence panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Warning list */}
                <div style={{ ...panel, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", ...SL }}>Active Warnings</div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }} className="scrollbar-none">
                    {warnings.slice(0, 12).map(w => (
                      <div key={w.warningId}
                        onClick={() => setSelectedDistrict(w.districtCode)}
                        style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selectedDistrict === w.districtCode ? "var(--cyan-glow-sm)" : "transparent", transition: "background 150ms" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{w.districtName}</span>
                          <WarningBadge level={w.warningLevel} size="sm"/>
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
                          {w.stateName} · {Math.round(w.expectedRainfallMm)}mm · {formatNumber(w.populationAtRisk || 0)} at risk
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NDRF mini */}
                <div style={{ ...panel, padding: "14px" }}>
                  <div style={{ ...SL, marginBottom: 10 }}>NDRF Status Overview</div>
                  {ndrfUnits.slice(0, 4).map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-primary)" }}>{u.name}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)" }}>{u.district}</div>
                      </div>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                        textTransform: "uppercase", padding: "2px 7px", borderRadius: "var(--r-full)",
                        color: STATUS_COLOR[u.status], background: STATUS_BG[u.status],
                        border: `1px solid ${STATUS_COLOR[u.status]}30`,
                      }}>{u.status}</span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab("ndrf")} className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: "100%", justifyContent: "center", fontFamily: "var(--font-body)", fontSize: 11 }}>
                    View all NDRF units →
                  </button>
                </div>

                {/* Activity feed mini */}
                <div style={{ ...panel, padding: "14px" }}>
                  <div style={{ ...SL, marginBottom: 10 }}>Recent Activity</div>
                  {ACTIVITY_FEED.slice(0, 4).map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", flexShrink: 0, marginTop: 1 }}>{a.time}</span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{a.label}</span>
                    </div>
                  ))}
                  <span className="badge-demo" style={{ marginTop: 8, display: "inline-flex" }}>DEMO DATA</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════
             NDRF TAB
          ════════════════════════════════════════════════════ */}
          {activeTab === "ndrf" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ ...SL }}>NDRF / SDRF Resource Status</div>
                <span className="badge-demo">DEMO — Simulated Units</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {ndrfUnits.map(u => (
                  <div key={u.id} style={{ ...panel, padding: "16px", borderLeft: `3px solid ${STATUS_COLOR[u.status]}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{u.name}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>{u.id} · {u.battalion}</div>
                      </div>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
                        textTransform: "uppercase", padding: "3px 8px", borderRadius: "var(--r-full)",
                        color: STATUS_COLOR[u.status], background: STATUS_BG[u.status],
                        border: `1px solid ${STATUS_COLOR[u.status]}30`,
                      }}>{u.status}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {[
                        { label: "District",   val: u.district },
                        { label: "Personnel",  val: u.personnel },
                        { label: "Boats",      val: u.boats },
                      ].map((m, i) => (
                        <div key={i} style={{ background: "var(--bg-surface)", borderRadius: "var(--r-sm)", padding: "7px 8px" }}>
                          <div style={{ ...SL, fontSize: 8, marginBottom: 3 }}>{m.label}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {u.status !== "deployed" && (
                        confirmAction === `deploy-${u.id}` ? (
                          <div style={{ display: "flex", gap: 5, flex: 1 }}>
                            <button onClick={() => deployNDRF(u.id)} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center", fontFamily: "var(--font-body)" }}>Confirm Deploy</button>
                            <button onClick={() => setConfirmAction(null)} className="btn btn-secondary btn-sm" style={{ fontFamily: "var(--font-body)" }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => deployNDRF(u.id)} className="btn btn-primary btn-sm" style={{ fontFamily: "var(--font-body)" }}>Deploy Unit</button>
                        )
                      )}
                      <a href={`tel:${u.contact}`} className="btn btn-secondary btn-sm" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>
                        📞 {u.contact}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════
             SHELTERS TAB
          ════════════════════════════════════════════════════ */}
          {activeTab === "shelters" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ ...SL }}>Emergency Shelter Network</div>
                <span className="badge-demo">DEMO</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                {[
                  { name: "Andheri Sports Complex",  capacity: 2500, occupied: 1840, district: "Mumbai",  status: "Active" },
                  { name: "Borivali Community Hall",  capacity: 800,  occupied: 620,  district: "Mumbai",  status: "Active" },
                  { name: "Kurla Municipal School",   capacity: 600,  occupied: 0,    district: "Mumbai",  status: "Standby" },
                  { name: "Wayanad Relief Camp A",    capacity: 1200, occupied: 890,  district: "Wayanad", status: "Active" },
                  { name: "Guwahati Flood Shelter",   capacity: 3000, occupied: 2100, district: "Kamrup",  status: "Active" },
                  { name: "Puri Cyclone Centre",      capacity: 5000, occupied: 0,    district: "Puri",    status: "Standby" },
                ].map((s, i) => {
                  const pct = Math.round((s.occupied / s.capacity) * 100);
                  const col = pct > 80 ? "var(--red)" : pct > 50 ? "var(--orange)" : "var(--green)";
                  return (
                    <div key={i} style={{ ...panel, padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", color: s.status === "Active" ? "var(--green)" : "var(--yellow)", textTransform: "uppercase" }}>{s.status}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginBottom: 10 }}>{s.district}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Occupancy</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: col }}>{s.occupied}/{s.capacity}</span>
                      </div>
                      <div className="confidence-bar-track">
                        <div className="confidence-bar-fill" style={{ width: `${pct}%`, background: col }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════
             ACTIVITY TAB
          ════════════════════════════════════════════════════ */}
          {activeTab === "activity" && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ ...SL }}>Activity Log</div>
                <span className="badge-demo">DEMO</span>
              </div>
              <div style={{ ...panel, overflow: "hidden" }}>
                {[
                  { time: "15:23", label: "RED warning created · Mumbai · AI 87% confidence",       type: "alert"   },
                  { time: "15:20", label: "Emergency bulletin published · Maharashtra Region",        type: "bulletin"},
                  { time: "15:18", label: "NDRF Team-7 deployed to Kurla West",                     type: "deploy"  },
                  { time: "15:15", label: "12 shelters activated in Andheri (capacity: 18,400)",     type: "shelter" },
                  { time: "15:12", label: "Satellite data ingested · INSAT-3DR · 96% quality",       type: "data"    },
                  { time: "15:10", label: "AI ensemble predicted Wayanad RED · Confidence 91%",      type: "ai"      },
                  { time: "15:07", label: "ORANGE warning upgraded to RED · Mumbai · Kurla zone",    type: "alert"   },
                  { time: "15:04", label: "SMS broadcast sent · 23,450 subscribers notified",        type: "alert"   },
                  { time: "15:01", label: "District Collector briefed · Ernakulam",                 type: "brief"   },
                  { time: "14:58", label: "Doppler radar data ingested · 39/39 online",             type: "data"    },
                ].map((a, i) => {
                  const typeColor: Record<string, string> = { alert: "var(--red)", bulletin: "var(--cyan)", deploy: "var(--blue)", shelter: "var(--green)", data: "var(--purple)", ai: "var(--yellow)", brief: "var(--orange)" };
                  return (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)", flexShrink: 0, minWidth: 36 }}>{a.time}</span>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: typeColor[a.type] || "var(--text-muted)", flexShrink: 0, display: "inline-block" }}/>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{a.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
