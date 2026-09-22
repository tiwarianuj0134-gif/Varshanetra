"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { getWarningColor } from "@/lib/utils";

interface KisanProps {
  userDistrict?: string | null;
  onSwitchToExpert: () => void;
}

interface WarningItem {
  districtCode: string;
  districtName: string;
  stateName: string;
  warningLevel: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  expectedRainfallMm: number;
}

/* ── Language strings ────────────────────────────────────────── */
const TRANSLATIONS = {
  en: {
    title:          "Citizen Weather Safety Portal",
    subtitle:       "Rainfall and flood warnings for your district",
    selectDistrict: "Your District",
    warningLabel:   "Flood Warning Level",
    expectedRain:   "Expected Rainfall",
    advice:         "What to do now",
    cropTitle:      "Farming Advisory",
    cropDesc: (lvl: string) => lvl === "RED" || lvl === "ORANGE"
      ? "STOP all field work immediately. Drain waterlogged areas. Harvest ripe crops now."
      : "Normal farming activities can continue. Check soil moisture before watering.",
    shelterTitle:   "Emergency Shelter",
    shelterCTA:     "Find nearest shelter →",
    emergency:      "Emergency Helplines",
    listenBtn:      "Listen to advisory",
    expertBtn:      "Switch to Expert View",
    day: ["Today","Tomorrow","Day 3","Day 4"],
  },
  hi: {
    title:          "नागरिक मौसम सुरक्षा पोर्टल",
    subtitle:       "अपने जिले की वर्षा और बाढ़ चेतावनी",
    selectDistrict: "अपना जिला",
    warningLabel:   "बाढ़ चेतावनी स्तर",
    expectedRain:   "अनुमानित वर्षा",
    advice:         "अभी क्या करें",
    cropTitle:      "कृषि सलाह",
    cropDesc: (lvl: string) => lvl === "RED" || lvl === "ORANGE"
      ? "सभी खेती का काम तुरंत बंद करें। जलभराव वाले क्षेत्रों से पानी निकालें।"
      : "सामान्य कृषि कार्य जारी रख सकते हैं।",
    shelterTitle:   "आपातकालीन आश्रय",
    shelterCTA:     "निकटतम आश्रय खोजें →",
    emergency:      "आपातकालीन हेल्पलाइन",
    listenBtn:      "सलाह सुनें",
    expertBtn:      "विशेषज्ञ दृश्य",
    day: ["आज","कल","परसों","चौथा दिन"],
  },
  mr: {
    title:          "नागरिक हवामान सुरक्षा पोर्टल",
    subtitle:       "तुमच्या जिल्ह्याचा पूर इशारा",
    selectDistrict: "तुमचा जिल्हा",
    warningLabel:   "पूर इशारा पातळी",
    expectedRain:   "अपेक्षित पाऊस",
    advice:         "आत्ता काय करावे",
    cropTitle:      "शेती सल्ला",
    cropDesc: (lvl: string) => lvl === "RED" || lvl === "ORANGE"
      ? "तत्काळ शेतातील काम बंद करा. जलमग्न क्षेत्र निचरा करा."
      : "सामान्य शेती कार्य सुरू ठेवू शकता.",
    shelterTitle:   "आपत्कालीन निवारा",
    shelterCTA:     "जवळचा निवारा शोधा →",
    emergency:      "आपत्कालीन हेल्पलाइन",
    listenBtn:      "सल्ला ऐका",
    expertBtn:      "तज्ञ दृश्य",
    day: ["आज","उद्या","परवा","चौथा दिवस"],
  },
};

const LEVEL_CONFIG = {
  RED:    { label: "SEVERE FLOOD WARNING",        color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.30)",  text: "#F87171", action: "Evacuate immediately to higher ground. Do NOT enter flooded areas." },
  ORANGE: { label: "HEAVY RAIN WARNING",          color: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.30)", text: "#FB923C", action: "Stay indoors. Avoid roads and drains. Keep emergency kit ready." },
  YELLOW: { label: "MODERATE RAIN — BE ALERT",    color: "#EAB308", bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.30)",  text: "#FCD34D", action: "Monitor updates. Clear gutters. Move valuables to higher floors." },
  GREEN:  { label: "NO ACTIVE WARNING",           color: "#10B981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", text: "#34D399", action: "Conditions normal. Stay alert to local weather changes." },
};

/* ═════════════════════════════════════════════════════════════ */
export function KisanDashboard({ userDistrict, onSwitchToExpert }: KisanProps) {
  const defaultCode = INDIAN_DISTRICTS.find(d => d.name.toLowerCase() === (userDistrict || "").toLowerCase())?.code || "MH-MUM";
  const [selectedCode,  setSelectedCode]  = useState(defaultCode);
  const [districtData,  setDistrictData]  = useState<Record<string, unknown> | null>(null);
  const [allWarnings,   setAllWarnings]   = useState<WarningItem[]>([]);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const [lang,          setLang]          = useState<"en" | "hi" | "mr">("en");

  const district = INDIAN_DISTRICTS.find(d => d.code === selectedCode) || INDIAN_DISTRICTS[0];
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = window.localStorage.getItem("kisan_lang") as "en" | "hi" | "mr" | null;
      if (s) setLang(s);
    }
  }, []);

  const changeLang = (l: "en" | "hi" | "mr") => {
    setLang(l);
    if (typeof window !== "undefined") window.localStorage.setItem("kisan_lang", l);
  };

  useEffect(() => {
    fetch(`/api/district/${selectedCode}`)
      .then(r => r.json())
      .then(setDistrictData)
      .catch(() => {});
  }, [selectedCode]);

  useEffect(() => {
    fetch("/api/warnings?limit=30")
      .then(r => r.json())
      .then(d => setAllWarnings(d.warnings || []))
      .catch(() => {});
  }, []);

  const warning  = (districtData as {warning?: WarningItem} | null)?.warning as WarningItem | undefined;
  const current  = (districtData as {current?: {rainfall24h?: number}} | null)?.current;
  const rain24   = current?.rainfall24h || 45;
  const level    = (warning?.warningLevel || (rain24 > 115 ? "ORANGE" : rain24 > 64 ? "YELLOW" : "GREEN")) as keyof typeof LEVEL_CONFIG;
  const lvlConf  = LEVEL_CONFIG[level];
  const nearby   = allWarnings.filter(w => w.stateName === district.state && w.districtCode !== district.code).slice(0, 4);

  const speak = () => {
    if (!("speechSynthesis" in window)) { alert("Voice not supported in this browser."); return; }
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const txt = `${lvlConf.label} for ${district.name}. ${lvlConf.action}`;
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = lang === "hi" || lang === "mr" ? "hi-IN" : "en-IN";
    u.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
    setIsSpeaking(true);
  };

  const FORECAST = t.day.map((d, i) => ({
    day: d,
    rain: Math.max(0, Math.round((warning?.expectedRainfallMm || 60) * (1 - i * 0.18) + (Math.random() - 0.5) * 15)),
    level: i === 0 ? level : i === 1 ? (level === "RED" ? "ORANGE" : level === "ORANGE" ? "YELLOW" : "GREEN") : "GREEN",
  }));

  return (
    <div style={{ fontFamily: "var(--font-body)", maxWidth: 800, margin: "0 auto", padding: "0 0 40px" }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{t.title}</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Language selector */}
          {(["en","hi","mr"] as const).map(l => (
            <button key={l} onClick={() => changeLang(l)}
              style={{ padding: "5px 10px", borderRadius: "var(--r-sm)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 150ms",
                background: lang === l ? "var(--cyan-glow-sm)" : "transparent",
                border: `1px solid ${lang === l ? "var(--border-accent)" : "var(--border)"}`,
                color: lang === l ? "var(--cyan)" : "var(--text-muted)",
              }}>
              {l === "en" ? "EN" : l === "hi" ? "हि" : "म"}
            </button>
          ))}
          <button onClick={onSwitchToExpert} className="btn btn-secondary btn-sm" style={{ fontFamily: "var(--font-body)", fontSize: 11 }}>
            {t.expertBtn}
          </button>
        </div>
      </div>

      {/* ── District selector ───────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{t.selectDistrict}</label>
        <select value={selectedCode} onChange={e => setSelectedCode(e.target.value)}
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14, padding: "10px 12px", width: "100%", outline: "none", fontWeight: 500 }}>
          {INDIAN_DISTRICTS.map(d => (
            <option key={d.code} value={d.code}>{d.name} — {d.state}</option>
          ))}
        </select>
      </div>

      {/* ── WARNING CARD — hero element ─────────────────────── */}
      <div style={{
        background: lvlConf.bg, border: `2px solid ${lvlConf.border}`,
        borderRadius: "var(--r-xl)", padding: "28px 24px", marginBottom: 16,
        animation: level === "RED" ? "severity-glow-red 2.5s ease-in-out infinite" : level === "ORANGE" ? "severity-glow-orange 2.5s ease-in-out infinite" : "none",
      }}>
        {/* Level indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {(level === "RED" || level === "ORANGE") && <span className="live-dot" style={{ background: lvlConf.color, width: 8, height: 8 }}/>}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: lvlConf.color }}>{t.warningLabel}</span>
        </div>

        {/* Big severity text */}
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,4vw,2.5rem)", fontWeight: 700, color: lvlConf.text, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 8 }}>
          {lvlConf.label}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          📍 {district.name}, {district.state}
        </p>

        {/* Expected rainfall */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 700, color: lvlConf.color, lineHeight: 1 }}>
            {warning ? Math.round(warning.expectedRainfallMm) : Math.round(rain24)}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>mm</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>{t.expectedRain}</span>
        </div>

        {/* Action instruction */}
        <div style={{ background: "rgba(7,11,20,0.5)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: 16, border: `1px solid ${lvlConf.border}` }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: lvlConf.color, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{t.advice}</div>
          <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 500 }}>{lvlConf.action}</p>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={speak}
            style={{
              padding: "10px 18px", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: isSpeaking ? lvlConf.color : "transparent",
              border: `1px solid ${lvlConf.border}`,
              color: isSpeaking ? "var(--text-on-accent)" : lvlConf.text,
              transition: "all 200ms", fontFamily: "var(--font-body)",
            }}>
            🔊 {t.listenBtn}
          </button>
          <a href="tel:112" style={{ padding: "10px 18px", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.30)", color: "#F87171", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
            📞 112 Emergency
          </a>
        </div>
      </div>

      {/* ── 4-day forecast ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {FORECAST.map((f, i) => {
          const fc = LEVEL_CONFIG[f.level as keyof typeof LEVEL_CONFIG];
          return (
            <div key={i} style={{ background: "var(--bg-panel)", border: `1px solid ${fc.border}`, borderRadius: "var(--r-lg)", padding: "14px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em" }}>{f.day}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: fc.color, lineHeight: 1, marginBottom: 4 }}>{f.rain}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>mm</span></div>
              <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: fc.text, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.level}</div>
              <span className="badge-demo" style={{ marginTop: 6, fontSize: 8 }}>MODEL</span>
            </div>
          );
        })}
      </div>

      {/* ── Crop advisory ───────────────────────────────────── */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px", marginBottom: 14 }}>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>🌾 {t.cropTitle}</h4>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{t.cropDesc(level)}</p>
      </div>

      {/* ── Emergency shelter ───────────────────────────────── */}
      <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "var(--r-lg)", padding: "16px", marginBottom: 14 }}>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 600, color: "var(--green)", marginBottom: 6 }}>🏠 {t.shelterTitle}</h4>
        <Link href="/evacuation" style={{ color: "var(--green)", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{t.shelterCTA}</Link>
      </div>

      {/* ── Nearby warnings ─────────────────────────────────── */}
      {nearby.length > 0 && (
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
            Nearby Districts — {district.state}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {nearby.map(w => (
              <div key={w.districtCode} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{w.districtName}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: getWarningColor(w.warningLevel), fontWeight: 700 }}>{Math.round(w.expectedRainfallMm)}mm</span>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", color: getWarningColor(w.warningLevel) }}>{w.warningLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Emergency helplines ─────────────────────────────── */}
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px" }}>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>📞 {t.emergency}</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
          {[
            { label: "Emergency",    num: "112" },
            { label: "NDMA",         num: "1078" },
            { label: "IMD Weather",  num: "14410" },
            { label: "State SDMA",   num: "1070" },
          ].map(h => (
            <a key={h.num} href={`tel:${h.num}`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", textDecoration: "none", transition: "all 150ms" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", fontWeight: 700, color: "var(--red)", lineHeight: 1, marginBottom: 4 }}>{h.num}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>{h.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
