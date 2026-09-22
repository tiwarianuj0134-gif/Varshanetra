"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

/* ── Types ───────────────────────────────────────────────────── */
interface PublicStats {
  warnings: { RED: number; ORANGE: number; YELLOW: number; total: number };
  statistics: {
    peopleAtRisk: number; maxRainfall24h: number; hotspot: string;
    modelAccuracy: number; predictionsToday: number; alertsSentToday: number;
  };
}

/* ── Static content ──────────────────────────────────────────── */
const ROLES = [
  {
    id: "researcher",
    icon: "◎",
    label: "Expert / Researcher",
    desc: "IMD scientists, hydrologists, atmospheric researchers",
    features: ["5-model AI ensemble with confidence intervals", "SHAP-based explainability charts", "Raw API access & model metrics", "ERA5 + GPM-IMERG data fusion"],
    cta: "Access Expert Dashboard",
    href: "/register?role=researcher",
    accent: "#8B5CF6",
    accentBg: "rgba(139,92,246,0.08)",
    accentBorder: "rgba(139,92,246,0.22)",
  },
  {
    id: "government",
    icon: "⊞",
    label: "Government Officer",
    desc: "District Collectors, NDMA, SDMA, emergency responders",
    features: ["Impact-based decision support", "Resource deployment maps", "Official bulletin generation", "Multi-channel broadcast alerts"],
    cta: "Government Command Center",
    href: "/register?role=government",
    accent: "#3B82F6",
    accentBg: "rgba(59,130,246,0.08)",
    accentBorder: "rgba(59,130,246,0.22)",
  },
  {
    id: "citizen",
    icon: "⊹",
    label: "Citizen / Farmer",
    desc: "General public, farmers, local community members",
    features: ["Plain-language flood warnings", "Location-based alert subscriptions", "8 Indian language support", "Offline SMS backup"],
    cta: "Citizen Safety View",
    href: "/register?role=public",
    accent: "#10B981",
    accentBg: "rgba(16,185,129,0.08)",
    accentBorder: "rgba(16,185,129,0.22)",
  },
  {
    id: "ai",
    icon: "◈",
    label: "VARSHA AI",
    desc: "Conversational flood intelligence for anyone",
    features: ["Natural language flood queries", "Local language voice support", "Live data-backed responses", "Source-cited answers"],
    cta: "Talk to VARSHA AI",
    href: "/register",
    accent: "#06B6D4",
    accentBg: "rgba(6,182,212,0.08)",
    accentBorder: "rgba(6,182,212,0.22)",
  },
];

const DATA_SOURCES = [
  { icon: "🛰️", label: "INSAT-3DR Satellite", spec: "4km / 15 min", detail: "Thermal IR + WV channels", color: "#8B5CF6" },
  { icon: "📡", label: "Doppler Radar",        spec: "39 radars / 6 min", detail: "Quantitative precipitation", color: "#3B82F6" },
  { icon: "🌡️", label: "AWS Network",          spec: "800+ stations",   detail: "Ground-truth validation", color: "#06B6D4" },
  { icon: "🖥️", label: "NWP Models",           spec: "GFS / ECMWF",     detail: "Numerical weather forecast", color: "#10B981" },
  { icon: "🌊", label: "Flood Inventory",       spec: "Historical events", detail: "30-year event database", color: "#F97316" },
  { icon: "🛡️", label: "SAR Imagery",           spec: "Sentinel-1",      detail: "Flood extent mapping",    color: "#EAB308" },
];

const PIPELINE = [
  { step: "01", label: "Data Ingestion",   desc: "4 live sources merged every 15 min via Bayesian optimal interpolation", icon: "⬇" },
  { step: "02", label: "Quality Control",  desc: "Automated QC flags; outliers and sensor failures removed", icon: "⚙" },
  { step: "03", label: "AI Ensemble",      desc: "ConvLSTM + U-Net + Transformer + XGBoost + Meta-Learner run in parallel", icon: "◎" },
  { step: "04", label: "Risk Assessment",  desc: "PINN flood model estimates depth, area, population and infrastructure impact", icon: "≋" },
  { step: "05", label: "Warning Decision", desc: "Threshold exceeded → severity classified → CAP-format alert generated", icon: "⚠" },
  { step: "06", label: "Multi-Channel",    desc: "SMS + WhatsApp + Push + API broadcast in <20 seconds to subscribers", icon: "📡" },
];

const AI_MODELS = [
  { name: "ConvLSTM",      type: "Spatial–temporal nowcast", window: "0–6h",   color: "#06B6D4" },
  { name: "U-Net Radar",   type: "Radar-based QPE",          window: "0–3h",   color: "#3B82F6" },
  { name: "Transformer",   type: "Medium-range forecast",    window: "24–72h", color: "#8B5CF6" },
  { name: "XGBoost",       type: "Station-point regression", window: "0–12h",  color: "#10B981" },
  { name: "Meta-Learner",  type: "Bayesian ensemble fusion", window: "0–72h",  color: "#F97316" },
];

const COMPARISON = [
  ["Update Frequency",   "3–6 hours",         "Every 15 minutes"],
  ["Spatial Resolution", "District level",    "5 km grid"],
  ["Data Sources",       "Single / Siloed",   "6-source AI fusion"],
  ["Inundation Mapping", "Not available",     "Real-time PINN model"],
  ["Explainability",     "Black-box NWP",     "SHAP-based XAI"],
  ["Forecast Lead Time", "12–24 hours",       "Nowcast to 72 hours"],
  ["Impact Assessment",  "Basic warning",     "Population + roads + crops"],
  ["Alert Channels",     "Radio / TV",        "SMS + WhatsApp + App + API"],
  ["Languages",          "Hindi / English",   "8 Indian languages"],
];

/* ── Rain canvas ─────────────────────────────────────────────── */
function RainCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const drops = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      speed: 1.2 + Math.random() * 2.5, len: 8 + Math.random() * 16, opacity: 0.04 + Math.random() * 0.08,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drops.forEach(d => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(6,182,212,${d.opacity})`;
        ctx.lineWidth = 0.7;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 0.5, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        if (d.y > canvas.height + 30) { d.y = -30; d.x = Math.random() * canvas.width; }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

/* ── India SVG map (simplified) ─────────────────────────────── */
function IndiaMap({ warnings }: { warnings: { RED: number; ORANGE: number; YELLOW: number } }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Simplified India outline with glow effect */}
      <svg viewBox="0 0 400 460" style={{ width: "min(320px,90%)", opacity: 0.85 }}>
        <defs>
          <filter id="glow-cyan"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-red"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="base-grad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.15)"/>
            <stop offset="100%" stopColor="rgba(6,182,212,0)"/>
          </radialGradient>
        </defs>
        {/* India shape (simplified polygon) */}
        <path d="M 195 20 L 240 18 L 280 30 L 310 55 L 340 75 L 360 100 L 370 130 L 365 155 L 350 175 L 340 200 L 335 225 L 330 255 L 320 280 L 305 305 L 285 325 L 265 345 L 245 360 L 225 375 L 210 390 L 200 405 L 192 390 L 175 375 L 155 360 L 135 345 L 115 325 L 95 305 L 75 280 L 65 255 L 60 225 L 55 200 L 50 175 L 45 150 L 50 125 L 65 100 L 85 75 L 110 55 L 140 35 L 170 22 Z"
          fill="url(#base-grad)" stroke="rgba(6,182,212,0.35)" strokeWidth="1.5" filter="url(#glow-cyan)"/>
        {/* Grid lines */}
        {[0,1,2,3,4].map(i => (
          <line key={`h${i}`} x1="40" y1={100+i*70} x2="380" y2={100+i*70} stroke="rgba(6,182,212,0.06)" strokeWidth="0.5"/>
        ))}
        {[0,1,2,3,4].map(i => (
          <line key={`v${i}`} x1={80+i*60} y1="20" x2={80+i*60} y2="420" stroke="rgba(6,182,212,0.06)" strokeWidth="0.5"/>
        ))}
        {/* Warning dots — approximate positions */}
        {warnings.RED > 0 && <>
          <circle cx="210" cy="160" r="8" fill="rgba(239,68,68,0.3)" filter="url(#glow-red)"/><circle cx="210" cy="160" r="4" fill="#EF4444"/><circle cx="210" cy="160" r="8" fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.5" className="animate-ping" style={{transformOrigin:"210px 160px"}}/>
          <circle cx="155" cy="330" r="7" fill="rgba(239,68,68,0.3)" filter="url(#glow-red)"/><circle cx="155" cy="330" r="3.5" fill="#EF4444"/>
        </>}
        {warnings.ORANGE > 0 && <>
          <circle cx="135" cy="200" r="6" fill="rgba(249,115,22,0.35)"/><circle cx="135" cy="200" r="3" fill="#F97316"/>
          <circle cx="285" cy="175" r="6" fill="rgba(249,115,22,0.35)"/><circle cx="285" cy="175" r="3" fill="#F97316"/>
          <circle cx="170" cy="280" r="5" fill="rgba(249,115,22,0.35)"/><circle cx="170" cy="280" r="2.5" fill="#F97316"/>
        </>}
        {warnings.YELLOW > 0 && <>
          <circle cx="230" cy="230" r="5" fill="rgba(234,179,8,0.35)"/><circle cx="230" cy="230" r="2.5" fill="#EAB308"/>
          <circle cx="100" cy="260" r="5" fill="rgba(234,179,8,0.35)"/><circle cx="100" cy="260" r="2.5" fill="#EAB308"/>
          <circle cx="310" cy="250" r="5" fill="rgba(234,179,8,0.35)"/><circle cx="310" cy="250" r="2.5" fill="#EAB308"/>
        </>}
        {/* Data flow lines */}
        <line x1="200" y1="20" x2="210" y2="160" stroke="rgba(6,182,212,0.15)" strokeWidth="1" strokeDasharray="4 4"><animate attributeName="stroke-dashoffset" from="0" to="-16" dur="2s" repeatCount="indefinite"/></line>
      </svg>
      {/* Legend */}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12, alignItems: "center" }}>
        {[{ c: "#EF4444", l: "Red" }, { c: "#F97316", l: "Orange" }, { c: "#EAB308", l: "Yellow" }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: x.c, display: "inline-block" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" }}>{x.l}</span>
          </div>
        ))}
        <span className="badge-demo">DEMO</span>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [activeRole, setActiveRole] = useState(0);
  const [activePipe, setActivePipe] = useState(0);
  const [seeded, setSeeded] = useState(false);

  /* auth redirect — ALL hooks must run before any early return */
  useEffect(() => {
    if (!loading && user) {
      // If there's a redirect param from middleware, honour it; otherwise go to dashboard
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/dashboard';
      router.replace(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
    }
  }, [user, loading, router]);

  /* seed + stats */
  useEffect(() => {
    if (loading || user) return;
    fetch("/api/seed").then(r => r.json()).then(d => {
      if (!d.seeded) fetch("/api/seed", { method: "POST" }).then(() => setSeeded(true));
      else setSeeded(true);
    }).catch(() => setSeeded(true));
  }, [loading, user]);

  useEffect(() => {
    if (loading || user) return;
    const load = () => {
      fetch("/api/public/stats").then(r => r.json()).then(setStats).catch(() => {});
    };
    load();
    const t = setInterval(load, 90000);
    return () => clearInterval(t);
  }, [seeded, loading, user]);

  /* pipeline animation */
  useEffect(() => {
    const t = setInterval(() => setActivePipe(p => (p + 1) % PIPELINE.length), 1600);
    return () => clearInterval(t);
  }, []);

  /* role card rotation */
  useEffect(() => {
    const t = setInterval(() => setActiveRole(r => (r + 1) % ROLES.length), 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>🌧️</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em" }}>LOADING VARSHANETRA</div>
        </div>
      </div>
    );
  }
  // If logged in, show spinner while redirect effect fires (never blank)
  if (user) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌧️</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em" }}>REDIRECTING TO DASHBOARD…</div>
        </div>
      </div>
    );
  }

  const w = stats?.warnings ?? { RED: 3, ORANGE: 6, YELLOW: 8, total: 17 };
  const s = stats?.statistics ?? { peopleAtRisk: 125000, maxRainfall24h: 287, hotspot: "Mahabaleshwar, MH", modelAccuracy: 87, predictionsToday: 4589, alertsSentToday: 1245 };

  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>

      {/* ══ NAVBAR ════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 56, zIndex: 900,
        background: "rgba(7,11,20,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>🌧️</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>VARSHANETRA</span>
          <span className="badge-live" style={{ marginLeft: 2 }}>LIVE</span>
        </Link>

        <div style={{ flex: 1 }}/>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }} className="hide-mobile">
          {[["Features", "/features"], ["How It Works", "/how-it-works"], ["About", "/about"]].map(([l, h]) => (
            <Link key={h} href={h} style={{ padding: "5px 12px", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", textDecoration: "none", transition: "color 150ms" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
            >{l}</Link>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <Link href="/login" className="btn btn-secondary btn-sm" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>Sign In</Link>
          <Link href="/register" className="btn btn-primary btn-sm" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>Get Started</Link>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100dvh", display: "flex", alignItems: "center", paddingTop: 56, overflow: "hidden" }}>
        <RainCanvas />
        {/* Radial glow */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 800, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 65%)", pointerEvents: "none" }}/>
        <div className="hero-grid" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.6 }}/>

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 64, alignItems: "center" }} className="hero-grid-wrapper">

            {/* Left */}
            <div className="animate-fade-in-up">
              {/* Status badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "5px 12px", borderRadius: "var(--r-full)", background: "rgba(7,11,20,0.7)", border: "1px solid var(--border-accent)", backdropFilter: "blur(8px)" }}>
                <span className="live-dot"/>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--green)", letterSpacing: "0.08em" }}>SIH 2026 · Problem Statement 26071</span>
              </div>

              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(2.5rem,5vw,4rem)", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 16 }}>
                <span className="gradient-text">VARSHA</span>
                <span style={{ color: "var(--text-primary)" }}>NETRA</span>
              </h1>
              <p style={{ fontSize: "clamp(1.1rem,2vw,1.375rem)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.4 }}>
                See the Rain. Predict the Flood. Save Lives.
              </p>
              <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 36, maxWidth: 520, lineHeight: 1.7 }}>
                India&apos;s multi-modal AI flood intelligence platform — fusing satellite, radar, 800+ ground stations and NWP models into actionable warnings for government, citizens and researchers.
              </p>

              {/* Live stats bar */}
              <div style={{ display: "flex", gap: 0, marginBottom: 36, background: "rgba(13,20,34,0.8)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", backdropFilter: "blur(8px)", width: "fit-content" }}>
                {[
                  { label: "Active Warnings", value: w.total, suffix: "", color: "var(--text-primary)" },
                  { label: "People at Risk",  value: s.peopleAtRisk, suffix: "", color: "var(--orange)" },
                  { label: "AI Accuracy",     value: s.modelAccuracy, suffix: "%", color: "var(--cyan)" },
                  { label: "Peak Rainfall",   value: s.maxRainfall24h, suffix: "mm", color: "var(--blue)" },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "14px 20px",
                    borderRight: i < 3 ? "1px solid var(--border)" : "none",
                    minWidth: 110,
                  }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: item.color, lineHeight: 1, letterSpacing: "-0.02em" }}>
                      <AnimatedCounter target={item.value} duration={1.5} />{item.suffix}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 4 }}><span className="badge-demo">DEMO</span></div>
                  </div>
                ))}
              </div>

              {/* Severity pills */}
              <div style={{ display: "flex", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
                {[
                  { level: "RED",    count: w.RED,    bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.28)",  color: "#F87171" },
                  { level: "ORANGE", count: w.ORANGE, bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.28)", color: "#FB923C" },
                  { level: "YELLOW", count: w.YELLOW, bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.28)",  color: "#FCD34D" },
                ].map(x => (
                  <div key={x.level} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--r-full)", background: x.bg, border: `1px solid ${x.border}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: x.color, display: "inline-block" }}/>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: x.color, letterSpacing: "0.05em" }}>{x.count} {x.level}</span>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: "var(--r-full)", background: "rgba(6,182,212,0.08)", border: "1px solid var(--border-accent)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--cyan)" }}>87% AI Confidence</span>
                </div>
              </div>

              {/* CTA buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/register" className="btn btn-primary btn-lg" style={{ textDecoration: "none", fontFamily: "var(--font-body)", gap: 8 }}>
                  Get Started Free →
                </Link>
                <Link href="/login" className="btn btn-outline btn-lg" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>
                  Sign In
                </Link>
                <Link href="/historical" className="btn btn-secondary btn-lg" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>
                  View Historical Data
                </Link>
              </div>
            </div>

            {/* Right — India map visualization */}
            <div style={{ height: 460, position: "relative", borderRadius: "var(--r-xl)", overflow: "hidden", background: "rgba(13,20,34,0.7)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }} className="hide-tablet animate-fade-in">
              <div style={{ position: "absolute", top: 12, left: 14, zIndex: 2 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.10em", textTransform: "uppercase" }}>National Threat Map</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <span className="live-dot" style={{ width: 5, height: 5 }}/>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--green)" }}>LIVE — {w.total} active zones</span>
                </div>
              </div>
              <IndiaMap warnings={w} />
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.4 }}>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, var(--cyan), transparent)" }}/>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
        </div>
      </section>

      {/* ══ DATA SOURCES ══════════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Intelligence Infrastructure</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>Six Live Data Sources. One Fused Intelligence.</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 10, maxWidth: 480, margin: "10px auto 0" }}>Real-time ingestion every 15 minutes via Bayesian Optimal Interpolation</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {DATA_SOURCES.map((src, i) => (
              <div key={i} style={{
                background: "var(--bg-panel)", border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)", padding: "20px", cursor: "default",
                transition: "all var(--t-slow)",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = src.color + "50"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.4), 0 0 20px ${src.color}18`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: 24, marginBottom: 10 }}>{src.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{src.label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: src.color, fontWeight: 600, marginBottom: 4 }}>{src.spec}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{src.detail}</div>
                <div style={{ marginTop: 12, height: 2, background: "rgba(148,163,184,0.08)", borderRadius: 1 }}>
                  <div style={{ height: "100%", width: "100%", background: `linear-gradient(to right, ${src.color}, transparent)`, borderRadius: 1, animation: "fade-in 0.8s ease" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AI PIPELINE ═══════════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: "var(--bg-base)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>AI Intelligence Pipeline</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>Satellite to SMS in Under 20 Seconds</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 0, position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", top: 28, left: "8.3%", right: "8.3%", height: 1, background: "linear-gradient(to right, var(--cyan), var(--blue), var(--purple))", zIndex: 0, opacity: 0.3 }}/>
            {PIPELINE.map((step, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                padding: "0 12px", position: "relative", zIndex: 1,
                opacity: activePipe === i ? 1 : 0.5,
                transition: "opacity 500ms",
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: activePipe === i ? "rgba(6,182,212,0.15)" : "var(--bg-panel)",
                  border: activePipe === i ? "1px solid var(--border-accent)" : "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, marginBottom: 12,
                  boxShadow: activePipe === i ? "var(--glow-cyan)" : "none",
                  transition: "all 500ms",
                }}>
                  {step.icon}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--cyan)", letterSpacing: "0.1em", marginBottom: 4 }}>STEP {step.step}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 5 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AI MODELS ═════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <div className="section-label" style={{ marginBottom: 10 }}>AI Ensemble Architecture</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem,2.5vw,1.875rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 14 }}>
                Five Models. One Trusted Prediction.
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24, maxWidth: 420 }}>
                A Bayesian meta-learner dynamically weights each model&apos;s contribution based on real-time validation scores, giving you the most reliable possible flood forecast.
              </p>
              <div style={{ display: "flex", gap: 16 }}>
                {[{ val: "5", label: "AI Models" }, { val: "87%", label: "Ensemble Accuracy (demo)" }, { val: "72h", label: "Lead Time" }].map(m => (
                  <div key={m.label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--cyan)", letterSpacing: "-0.02em" }}>{m.val}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 3 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AI_MODELS.map((m, i) => (
                <div key={i} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: m.color, flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.type}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: m.color, fontWeight: 600 }}>{m.window}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)" }}>forecast window</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOUR ROLES ════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: "var(--bg-base)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Designed For Everyone</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>Four Roles. One Platform.</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 10 }}>Select your role to explore features built specifically for you</p>
          </div>
          {/* Tab selector */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
            {ROLES.map((r, i) => (
              <button key={r.id} onClick={() => setActiveRole(i)}
                style={{
                  padding: "8px 16px", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  background: activeRole === i ? r.accentBg : "transparent",
                  border: `1px solid ${activeRole === i ? r.accentBorder : "var(--border)"}`,
                  color: activeRole === i ? r.accent : "var(--text-muted)",
                  transition: "all var(--t-base)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
          {/* Active role card */}
          {(() => {
            const r = ROLES[activeRole];
            return (
              <div style={{
                background: r.accentBg, border: `1px solid ${r.accentBorder}`,
                borderRadius: "var(--r-xl)", padding: "36px", maxWidth: 640, margin: "0 auto",
                animation: "scale-in 0.2s ease-out",
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{r.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{r.label}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{r.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {r.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: r.accent, flexShrink: 0, marginTop: 1, fontSize: 13 }}>✓</span>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href={r.href} className="btn btn-primary" style={{ textDecoration: "none", background: r.accent, color: "var(--text-on-accent)", fontFamily: "var(--font-body)" }}>
                  {r.cta} →
                </Link>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ══ COMPARISON TABLE ══════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Platform Comparison</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>VARSHANETRA vs. Existing Systems</h2>
          </div>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ padding: "10px 20px", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Feature</div>
              <div style={{ padding: "10px 20px", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>Current IMD</div>
              <div style={{ padding: "10px 20px", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>VARSHANETRA</div>
            </div>
            {COMPARISON.map(([feat, old, next], i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
                borderBottom: i < COMPARISON.length - 1 ? "1px solid var(--border)" : "none",
                background: i % 2 === 0 ? "transparent" : "rgba(148,163,184,0.02)",
              }}>
                <div style={{ padding: "12px 20px", fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{feat}</div>
                <div style={{ padding: "12px 20px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>✕ {old}</div>
                <div style={{ padding: "12px 20px", fontSize: 12, color: "var(--green)", fontWeight: 600, textAlign: "center" }}>✓ {next}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ═════════════════════════════════════════ */}
      <section style={{ padding: "48px 24px", background: "var(--bg-base)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div className="section-label" style={{ marginBottom: 20 }}>Technology Stack</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", opacity: 0.6 }}>
            {["PyTorch", "ERA5", "GPM-IMERG", "Next.js 16", "MongoDB", "React-Leaflet", "Gemini AI", "Sentinel-1 SAR", "XGBoost", "Recharts", "WebSocket"].map(t => (
              <span key={t} style={{
                padding: "5px 12px", borderRadius: "var(--r-full)",
                background: "var(--bg-panel)", border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)",
              }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "var(--bg-surface)", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🌧️</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 14 }}>
            Ready to Deploy Flood Intelligence?
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 32 }}>
            Join researchers, government officials, and citizens using VARSHANETRA to protect lives.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn btn-primary btn-xl" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>Create Free Account →</Link>
            <Link href="/api-docs" className="btn btn-secondary btn-xl" style={{ textDecoration: "none", fontFamily: "var(--font-body)" }}>Developer API Docs</Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer style={{ background: "var(--bg-base)", borderTop: "1px solid var(--border)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 40, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🌧️</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>VARSHANETRA</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              National Flood Intelligence System. Built for Smart India Hackathon 2026 — Problem Statement 26071.
            </p>
          </div>
          {[
            { label: "Platform", links: [["Dashboard", "/dashboard"], ["Live Map", "/map"], ["3D Inundation", "/inundation"], ["VARSHA AI", "/chat"]] },
            { label: "Resources", links: [["API Docs", "/api-docs"], ["Architecture", "/architecture"], ["Historical", "/historical"], ["About", "/about"]] },
          ].map(col => (
            <div key={col.label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>{col.label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {col.links.map(([l, h]) => (
                  <Link key={h} href={h} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", transition: "color 150ms" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                  >{l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: "24px auto 0", paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)" }}>© 2026 VARSHANETRA Team · SIH Problem Statement 26071</span>
          <span className="badge-demo">DEMO / PROTOTYPE BUILD</span>
        </div>
      </footer>
    </div>
  );
}
