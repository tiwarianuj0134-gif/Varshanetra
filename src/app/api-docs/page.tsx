"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

/* ── Endpoint definitions ────────────────────────────────────── */
const ENDPOINTS = [
  {
    method: "GET", path: "/api/warnings", auth: false, status: "live",
    summary: "List all active warnings",
    description: "Returns active flood and rainfall warnings across India, sorted by severity.",
    params: [
      { name: "limit",  in: "query", type: "number",  required: false, desc: "Max results (default: 50)" },
      { name: "level",  in: "query", type: "string",  required: false, desc: "Filter by level: RED | ORANGE | YELLOW" },
      { name: "state",  in: "query", type: "string",  required: false, desc: "Filter by state name" },
    ],
    response: `{
  "warnings": [
    {
      "warningId": "WARN-MH-MUM-...",
      "districtCode": "MH-MUM",
      "districtName": "Mumbai",
      "warningLevel": "RED",
      "expectedRainfallMm": 287,
      "populationAtRisk": 124500,
      "validUntil": "2026-09-14T18:00:00Z"
    }
  ],
  "total": 40
}`,
  },
  {
    method: "GET", path: "/api/district/:code", auth: false, status: "live",
    summary: "District intelligence detail",
    description: "Returns full intelligence profile for a specific district including current conditions, AI forecast, SHAP values, and risk zones.",
    params: [
      { name: "code", in: "path", type: "string", required: true, desc: "District code e.g. MH-MUM, KL-WYD" },
    ],
    response: `{
  "district": { "code": "MH-MUM", "name": "Mumbai", "state": "Maharashtra" },
  "warning": { "warningLevel": "RED", "expectedRainfallMm": 287 },
  "current": { "rainfallMm": 45.2, "humidity": 92, "temperature": 28 },
  "predictions": [{ "forecastHorizon": 24, "predictedRainfallMm": 265, "confidenceScore": 0.87 }],
  "shapValues": [{ "name": "GPM Precipitation", "contribution": 38, "direction": "positive" }]
}`,
  },
  {
    method: "POST", path: "/api/inundation/simulate", auth: false, status: "live",
    summary: "Run flood inundation simulation",
    description: "Runs a physics-informed flood simulation for a given district with specified rainfall and duration. Returns risk zones, time series, and impact estimates.",
    params: [
      { name: "districtCode", in: "body", type: "string", required: true,  desc: "District code" },
      { name: "rainfallMm",   in: "body", type: "number", required: true,  desc: "Total rainfall in mm" },
      { name: "durationHours",in: "body", type: "number", required: false, desc: "Duration in hours (default: 24)" },
    ],
    response: `{
  "simulationId": "SIM-...",
  "results": {
    "maxWaterDepthM": 2.3,
    "affectedAreaKm2": 18.4,
    "populationAtRisk": 47200,
    "buildingsAffected": 8900
  },
  "modelInfo": { "type": "PINN", "confidence": 0.78 },
  "timeSeriesData": [{ "hour": 0, "waterDepthM": 0.0 }, ...]
}`,
  },
  {
    method: "POST", path: "/api/chat", auth: false, status: "live",
    summary: "VARSHA AI conversational endpoint",
    description: "Natural language flood intelligence queries powered by Gemini AI with live database context injection.",
    params: [
      { name: "message",   in: "body", type: "string", required: true, desc: "User question or query" },
      { name: "sessionId", in: "body", type: "string", required: false, desc: "Session ID for context continuity" },
    ],
    response: `{
  "response": "Mumbai is currently under RED alert with 287mm expected rainfall...",
  "sessionId": "session-..."
}`,
  },
  {
    method: "GET", path: "/api/public/stats", auth: false, status: "live",
    summary: "Public platform statistics",
    description: "Public-facing platform statistics — no authentication required. Suitable for embedding in external dashboards.",
    params: [],
    response: `{
  "warnings": { "RED": 3, "ORANGE": 6, "YELLOW": 8, "total": 17 },
  "statistics": {
    "peopleAtRisk": 125000,
    "maxRainfall24h": 287,
    "hotspot": "Mahabaleshwar, MH",
    "modelAccuracy": 87,
    "predictionsToday": 4589
  }
}`,
  },
  {
    method: "GET", path: "/api/ai/models", auth: false, status: "live",
    summary: "AI model performance metrics",
    description: "Returns performance metrics, accuracy scores, and operational status of all 5 AI ensemble models.",
    params: [],
    response: `{
  "models": [
    { "name": "ConvLSTM", "type": "Nowcast", "accuracy": 0.89, "status": "operational" },
    { "name": "U-Net Radar", "type": "QPE", "accuracy": 0.85, "status": "operational" }
  ]
}`,
  },
  {
    method: "POST", path: "/api/community/reports", auth: false, status: "live",
    summary: "Submit community flood report",
    description: "Accepts a citizen ground-truth flood report. Reports are queued for AI verification before becoming visible.",
    params: [
      { name: "districtName", in: "body", type: "string", required: true,  desc: "District name" },
      { name: "reportType",   in: "body", type: "string", required: true,  desc: "waterlogging | flood | landslide | road_blocked" },
      { name: "severity",     in: "body", type: "string", required: true,  desc: "low | medium | high | critical" },
      { name: "description",  in: "body", type: "string", required: true,  desc: "Free text description" },
      { name: "waterDepthCm", in: "body", type: "number", required: false, desc: "Observed water depth in cm" },
    ],
    response: `{
  "success": true,
  "report": { "id": 123, "isVerified": false, "reportedAt": "2026-09-14T..." }
}`,
  },
  {
    method: "GET", path: "/api/dashboard/overview", auth: true, status: "live",
    summary: "Dashboard overview data",
    description: "Full dashboard data including active warnings, top rainfall stations, and system statistics. Requires authentication.",
    params: [],
    response: `{
  "warnings": { "RED": 3, "ORANGE": 6, "YELLOW": 8, "total": 17 },
  "statistics": { "activeStations": 785, "modelAccuracy": 87 },
  "topStations": [{ "stationName": "Mahabaleshwar AWS", "rainfall24h": 287 }]
}`,
  },
];

const METHOD_STYLES: Record<string, { bg: string; color: string }> = {
  GET:  { bg: "rgba(16,185,129,0.12)", color: "var(--green)" },
  POST: { bg: "rgba(59,130,246,0.12)", color: "var(--blue)" },
  PATCH:{ bg: "rgba(234,179,8,0.12)", color: "var(--yellow)" },
  DELETE:{ bg:"rgba(239,68,68,0.12)", color: "var(--red)" },
};

const STATUS_BADGES: Record<string, JSX.Element> = {
  live:    <span className="badge-live">Live</span>,
  planned: <span className="badge-demo">Planned</span>,
  demo:    <span className="badge-demo">Demo</span>,
};

/* ═════════════════════════════════════════════════════════════ */
export default function ApiDocsPage() {
  const [active, setActive] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyResponse = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    }).catch(() => {});
  };

  const panel = { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" } as const;
  const SL = { fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 as const, letterSpacing: "0.10em" as const, textTransform: "uppercase" as const, color: "var(--text-muted)" };

  const ep = ENDPOINTS[active];

  return (
    <AppShell>
      <div style={{ height: "calc(100dvh - 84px)", display: "flex", overflow: "hidden" }}>

        {/* ── Sidebar: endpoint list ─────────────────────── */}
        <aside style={{ width: 260, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto", background: "var(--bg-surface)", padding: "16px 10px" }} className="scrollbar-none">
          <div style={{ ...SL, marginBottom: 12, paddingLeft: 6 }}>API Reference</div>
          <div style={{ marginBottom: 16, paddingLeft: 6 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)", lineHeight: 1.6 }}>
              Base URL:<br/>
              <span style={{ color: "var(--cyan)" }}>http://localhost:3000</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {ENDPOINTS.map((e, i) => {
              const ms = METHOD_STYLES[e.method];
              return (
                <button key={i} onClick={() => setActive(i)}
                  style={{
                    padding: "8px 10px", borderRadius: "var(--r-sm)", textAlign: "left",
                    background: active === i ? "var(--cyan-glow-sm)" : "transparent",
                    border: `1px solid ${active === i ? "var(--border-accent)" : "transparent"}`,
                    cursor: "pointer", width: "100%", transition: "all 150ms", fontFamily: "var(--font-body)",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: "3px", background: ms?.bg, color: ms?.color, letterSpacing: "0.06em" }}>{e.method}</span>
                    {STATUS_BADGES[e.status]}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: active === i ? "var(--cyan)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.path}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{e.summary}</div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main: endpoint detail ─────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px" }} className="scrollbar-none">
          <div style={{ maxWidth: 760 }}>

            {/* Endpoint header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, padding: "4px 10px", borderRadius: "var(--r-sm)", background: METHOD_STYLES[ep.method]?.bg, color: METHOD_STYLES[ep.method]?.color, fontSize: 12, letterSpacing: "0.06em" }}>{ep.method}</span>
                {STATUS_BADGES[ep.status]}
                {ep.auth && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, color: "var(--yellow)", background: "var(--yellow-bg)", border: "1px solid var(--yellow-border)", borderRadius: "var(--r-full)", padding: "2px 7px", textTransform: "uppercase" }}>Auth Required</span>}
              </div>
              <div className="code-block" style={{ marginBottom: 10, fontSize: 14 }}>{ep.path}</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>{ep.summary}</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{ep.description}</p>
            </div>

            {/* Authentication */}
            <div style={{ ...panel, padding: "16px", marginBottom: 20 }}>
              <div style={{ ...SL, marginBottom: 8 }}>Authentication</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                {ep.auth
                  ? "This endpoint requires a valid session cookie. Log in via POST /api/auth/login to obtain a session."
                  : "This endpoint is publicly accessible — no authentication required."}
              </p>
            </div>

            {/* Parameters */}
            {ep.params.length > 0 && (
              <div style={{ ...panel, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", ...SL }}>Parameters</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>In</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map((p, i) => (
                      <tr key={i}>
                        <td><code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--cyan)", background: "var(--cyan-glow-sm)", padding: "1px 5px", borderRadius: 3 }}>{p.name}</code></td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{p.in}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--blue)" }}>{p.type}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: p.required ? "var(--red)" : "var(--text-dim)" }}>{p.required ? "yes" : "no"}</td>
                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Example request */}
            <div style={{ ...panel, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ ...SL }}>Example Request</div>
                <button onClick={() => copyResponse(`curl -X ${ep.method} http://localhost:3000${ep.path}`, active)} className="btn btn-ghost btn-sm" style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                  {copiedIdx === active ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="code-block" style={{ borderRadius: 0, border: "none" }}>
                <span style={{ color: "var(--yellow)" }}>curl</span>
                <span style={{ color: "var(--text-secondary)" }}> -X </span>
                <span style={{ color: "var(--green)" }}>{ep.method}</span>
                <span style={{ color: "var(--text-secondary)" }}> \</span>
                <br/>
                <span style={{ color: "var(--text-secondary)" }}>  &quot;http://localhost:3000</span>
                <span style={{ color: "var(--cyan)" }}>{ep.path}</span>
                <span style={{ color: "var(--text-secondary)" }}>&quot;</span>
                {ep.method === "POST" && (
                  <>
                    <br/>
                    <span style={{ color: "var(--text-secondary)" }}>  -H &quot;Content-Type: application/json&quot; \</span>
                    <br/>
                    <span style={{ color: "var(--text-secondary)" }}>  -d &apos;{"{"}&quot;...&quot;{"}"}&apos;</span>
                  </>
                )}
              </div>
            </div>

            {/* Response */}
            <div style={{ ...panel, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ ...SL }}>Example Response — 200 OK</div>
                <button onClick={() => copyResponse(ep.response, active + 100)} className="btn btn-ghost btn-sm" style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                  {copiedIdx === active + 100 ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="code-block" style={{ borderRadius: 0, border: "none", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowX: "auto" }}>
                {ep.response}
              </pre>
            </div>

            {/* Status codes */}
            <div style={{ ...panel, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", ...SL }}>Response Codes</div>
              <table className="data-table">
                <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
                <tbody>
                  {[
                    { code: "200", desc: "Success" },
                    { code: "400", desc: "Bad request — missing required parameters" },
                    { code: "401", desc: "Unauthorized — authentication required" },
                    { code: "404", desc: "Not found — district or resource not found" },
                    { code: "500", desc: "Server error — try again later" },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: r.code.startsWith("2") ? "var(--green)" : r.code.startsWith("4") ? "var(--orange)" : "var(--red)" }}>{r.code}</span></td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
