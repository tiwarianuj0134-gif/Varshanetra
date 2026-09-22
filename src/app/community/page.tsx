"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface Report {
  id: number; reporterName: string; locationName: string;
  districtName: string; stateName: string; reportType: string;
  description: string; waterDepthCm: number | null; severity: string;
  isVerified: boolean; upvotes: number; reportedAt: string;
  latitude: number; longitude: number;
}

const REPORT_TYPES = [
  { id: "waterlogging",    label: "Waterlogging",    color: "var(--blue)"   },
  { id: "flood",           label: "Flood",           color: "var(--red)"    },
  { id: "landslide",       label: "Landslide",       color: "var(--orange)" },
  { id: "road_blocked",    label: "Road Blocked",    color: "var(--yellow)" },
  { id: "bridge_damaged",  label: "Bridge Damaged",  color: "var(--red)"    },
];

const SEV_COLOR: Record<string, string> = {
  critical: "var(--red)", high: "var(--orange)", medium: "var(--yellow)", low: "var(--green)",
};

const VERIFICATION_STEPS = [
  { label: "Citizen Report Submitted",    desc: "Geo-tagged photo report received" },
  { label: "AI Image Analysis",           desc: "Gemini Vision validates flood evidence" },
  { label: "Location Cross-Check",        desc: "GPS coordinates verified against district" },
  { label: "Satellite Comparison",        desc: "INSAT-3DR imagery compared for consistency" },
  { label: "Human Review",               desc: "Expert operator reviews flagged reports" },
  { label: "Ground-Truth Dataset",        desc: "Verified report added to training data" },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [reports,         setReports]         = useState<Report[]>([]);
  const [showForm,        setShowForm]        = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [filter,          setFilter]          = useState("all");
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState<"reports" | "submit" | "pipeline">("reports");
  const [form, setForm] = useState({
    reporterName: user?.name || "",
    locationName: "",
    districtCode: "MH-MUM",
    reportType: "waterlogging",
    description: "",
    waterDepthCm: "",
    severity: "medium",
  });

  useEffect(() => {
    fetch("/api/community/reports?limit=50")
      .then(r => r.json())
      .then(d => { setReports(d.reports || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.name) setForm(f => ({ ...f, reporterName: user.name }));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const d = INDIAN_DISTRICTS.find(dd => dd.code === form.districtCode);
    try {
      const res = await fetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: form.reporterName,
          locationName: form.locationName,
          districtName: d?.name || "",
          stateName: d?.state || "",
          reportType: form.reportType,
          description: form.description,
          waterDepthCm: form.waterDepthCm ? Number(form.waterDepthCm) : null,
          severity: form.severity,
          latitude: String(d?.lat || 19.076),
          longitude: String(d?.lon || 72.877),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.report) setReports(prev => [data.report, ...prev]);
        setSuccess(true);
        setActiveTab("reports");
        setForm(f => ({ ...f, locationName: "", description: "", waterDepthCm: "" }));
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch { /* silent */ }
    setSubmitting(false);
  };

  const filtered = filter === "all" ? reports : reports.filter(r => r.severity === filter || r.reportType === filter);

  const panel = { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" } as const;
  const SL = { fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 as const, letterSpacing: "0.10em" as const, textTransform: "uppercase" as const, color: "var(--text-muted)" };
  const inputSt = { background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14, padding: "9px 12px", width: "100%", outline: "none" };

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 4 }}>
              Community Intelligence
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Citizen-as-sensor ground-truth reports — verified by AI and human experts</p>
          </div>
          <span className="badge-demo">Citizen Reports — AI Verified</span>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total Reports",    val: reports.length,                                               color: "var(--cyan)" },
            { label: "Verified",         val: reports.filter(r => r.isVerified).length,                    color: "var(--green)" },
            { label: "Pending Review",   val: reports.filter(r => !r.isVerified).length,                   color: "var(--yellow)" },
            { label: "Critical / High",  val: reports.filter(r => r.severity === "critical" || r.severity === "high").length, color: "var(--red)" },
          ].map((s, i) => (
            <div key={i} style={{ ...panel, padding: "14px", borderTop: `3px solid ${s.color}` }}>
              <div style={{ ...SL, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: s.color }}>{loading ? "—" : s.val}</div>
            </div>
          ))}
        </div>

        {/* Success banner */}
        {success && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", gap: 8 }}>
            <span className="live-dot"/>
            <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>Report submitted successfully! It will appear after AI verification.</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
          {[
            { id: "reports",  label: `Reports (${reports.length})` },
            { id: "submit",   label: "Submit Report" },
            { id: "pipeline", label: "Verification Pipeline" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as "reports" | "submit" | "pipeline")}
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

        {/* ── REPORTS TAB ─────────────────────────────────── */}
        {activeTab === "reports" && (
          <div>
            {/* Filter bar */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {[{ id: "all", label: "All" }, ...REPORT_TYPES.map(t => ({ id: t.id, label: t.label })), { id: "critical", label: "Critical" }].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  style={{ padding: "4px 12px", borderRadius: "var(--r-full)", fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 150ms", fontFamily: "var(--font-body)",
                    background: filter === f.id ? "var(--cyan-glow-sm)" : "transparent",
                    border: `1px solid ${filter === f.id ? "var(--border-accent)" : "var(--border)"}`,
                    color: filter === f.id ? "var(--cyan)" : "var(--text-muted)",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: "var(--r-lg)" }}/>)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⊹</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>No reports found</div>
                <button onClick={() => setActiveTab("submit")} className="btn btn-primary btn-sm" style={{ marginTop: 16, fontFamily: "var(--font-body)" }}>Submit First Report</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
                {filtered.map((r, i) => {
                  const typeConf = REPORT_TYPES.find(t => t.id === r.reportType);
                  return (
                    <div key={i} style={{ ...panel, padding: "16px", borderLeft: `3px solid ${SEV_COLOR[r.severity] || "var(--border)"}` }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{r.locationName || r.districtName}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>{r.districtName}, {r.stateName}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          {r.isVerified ? (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--green)", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: "var(--r-full)", padding: "2px 7px", textTransform: "uppercase" }}>Verified</span>
                          ) : (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--yellow)", background: "var(--yellow-bg)", border: "1px solid var(--yellow-border)", borderRadius: "var(--r-full)", padding: "2px 7px", textTransform: "uppercase" }}>Pending</span>
                          )}
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: SEV_COLOR[r.severity], textTransform: "uppercase" }}>{r.severity}</span>
                        </div>
                      </div>
                      {/* Type badge */}
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: typeConf?.color || "var(--text-muted)", background: (typeConf?.color || "var(--text-muted)") + "15", border: `1px solid ${typeConf?.color || "var(--text-muted)"}30`, borderRadius: "var(--r-full)", padding: "2px 8px" }}>
                          {typeConf?.label || r.reportType}
                        </span>
                      </div>
                      {/* Description */}
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 8 }}>{r.description}</p>
                      {/* Footer */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)" }}>
                          {r.reporterName} · {timeAgo(r.reportedAt)}
                        </div>
                        {r.waterDepthCm && (
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--cyan)" }}>
                            {r.waterDepthCm}cm depth
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SUBMIT TAB ──────────────────────────────────── */}
        {activeTab === "submit" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ ...panel, padding: "24px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Submit Ground-Truth Report</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                Your report will be AI-verified and may contribute to the ground-truth dataset.
              </p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ ...SL, display: "block", marginBottom: 5 }}>Your Name</label>
                    <input value={form.reporterName} onChange={e => setForm(f => ({ ...f, reporterName: e.target.value }))} required style={inputSt} placeholder="Enter name"/>
                  </div>
                  <div>
                    <label style={{ ...SL, display: "block", marginBottom: 5 }}>Location Name</label>
                    <input value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} required style={inputSt} placeholder="Area / street name"/>
                  </div>
                </div>
                <div>
                  <label style={{ ...SL, display: "block", marginBottom: 5 }}>District</label>
                  <select value={form.districtCode} onChange={e => setForm(f => ({ ...f, districtCode: e.target.value }))} style={{ ...inputSt }}>
                    {INDIAN_DISTRICTS.map(d => <option key={d.code} value={d.code}>{d.name}, {d.state}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ ...SL, display: "block", marginBottom: 5 }}>Report Type</label>
                    <select value={form.reportType} onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))} style={{ ...inputSt }}>
                      {REPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...SL, display: "block", marginBottom: 5 }}>Severity</label>
                    <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} style={{ ...inputSt }}>
                      {["low", "medium", "high", "critical"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...SL, display: "block", marginBottom: 5 }}>Water Depth (cm)</label>
                    <input type="number" value={form.waterDepthCm} onChange={e => setForm(f => ({ ...f, waterDepthCm: e.target.value }))} style={{ ...inputSt }} placeholder="Optional"/>
                  </div>
                </div>
                <div>
                  <label style={{ ...SL, display: "block", marginBottom: 5 }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4}
                    style={{ ...inputSt, resize: "vertical" }} placeholder="Describe what you observe — water level, road conditions, affected areas…"/>
                </div>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ justifyContent: "center", fontFamily: "var(--font-body)" }}>
                  {submitting ? "Submitting…" : "Submit Report →"}
                </button>
                <p style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center" }}>
                  Reports undergo AI verification before appearing publicly. Do not submit false reports.
                </p>
              </form>
            </div>
          </div>
        )}

        {/* ── PIPELINE TAB ────────────────────────────────── */}
        {activeTab === "pipeline" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>AI Verification Pipeline</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 8 }}>
                Each community report goes through a multi-stage verification process before being added to the ground-truth dataset.
              </p>
              <span className="badge-demo">Planned — Integration in Progress</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {VERIFICATION_STEPS.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 16, paddingBottom: 24, position: "relative" }}>
                  {/* Line connector */}
                  {i < VERIFICATION_STEPS.length - 1 && (
                    <div style={{ position: "absolute", left: 15, top: 32, width: 1, height: "calc(100% - 8px)", background: "linear-gradient(to bottom, var(--cyan), var(--border))" }}/>
                  )}
                  {/* Step circle */}
                  <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: i < 2 ? "var(--cyan-glow-sm)" : "var(--bg-panel)", border: `1px solid ${i < 2 ? "var(--border-accent)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: i < 2 ? "var(--cyan)" : "var(--text-muted)", zIndex: 1 }}>
                    {i < 2 ? "✓" : i + 1}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: i < 2 ? "var(--text-primary)" : "var(--text-secondary)", marginBottom: 3 }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...panel, padding: "14px", marginTop: 8, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-secondary)" }}>Note:</strong> Verified reports are stored in the ground-truth dataset for research purposes. 
              Automatic model retraining from citizen data is a planned feature, not currently active.
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
