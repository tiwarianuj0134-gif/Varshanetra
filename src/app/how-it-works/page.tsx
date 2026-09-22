"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

const STEPS = [
  {
    n:"01", icon:"🛰️", title:"Multi-Source Data Collection",
    color:"#00D4FF",
    desc:"Every 15 minutes, VARSHANETRA simultaneously ingests data from 4 independent sources: INSAT-3D satellite infrared and water vapor imagery, 39 Doppler Weather Radars, 800+ Automatic Weather Stations, and GFS numerical weather prediction model output.",
    technical:"APIs: MOSDAC (satellite), IMD DWR (radar), Open-Meteo (AWS/NWP). Data formats: NetCDF4, GeoTIFF, JSON. Storage: MongoDB time-series with TTL indexes.",
  },
  {
    n:"02", icon:"⚙️", title:"AI Data Fusion",
    color:"#A855F7",
    desc:"Raw data from all 4 sources is merged using Bayesian Optimal Interpolation — the same technique used by major weather centers. Quality control removes faulty observations. The result is a single, high-confidence rainfall analysis grid at 5km resolution.",
    technical:"Algorithm: Bayesian OI with error covariance matrices. Spatial interpolation: kriging. QC: buddy check, climatological limits. Output: 5km gridded analysis.",
  },
  {
    n:"03", icon:"🧠", title:"5 AI Models Run in Parallel",
    color:"#22C55E",
    desc:"The fused data feeds 5 AI models simultaneously. ConvLSTM handles nowcasting (0-6h), U-Net focuses on radar-based precipitation, Transformer handles medium-range (6-72h), XGBoost gives station-level point forecasts, and the ensemble meta-learner combines all four.",
    technical:"Models: All6RainfallNet (PyTorch), All6InundationNet (PyTorch). Features: ERA5+DEM+GPM+IMD+FloodInventory+SAR (20 features). Inference server: FastAPI on CPU.",
  },
  {
    n:"04", icon:"🌊", title:"Flood Inundation Simulation",
    color:"#3B82F6",
    desc:"Rainfall predictions feed the Physics-Informed Neural Network trained within Saint-Venant equations. Using real SRTM 30m digital elevation data, OSM building footprints, and drainage network data, it computes where water will accumulate and to what depth.",
    technical:"Physics: Saint-Venant shallow water equations. DEM: SRTM 30m. Buildings: OpenStreetMap. Population: WorldPop 100m grid. Output: Time-series depth grid.",
  },
  {
    n:"05", icon:"⚠️", title:"Impact Assessment & Warning",
    color:"#F97316",
    desc:"Thresholds are applied: >65mm/24h = Yellow, >115mm = Orange, >205mm = Red. The system computes which buildings, roads, hospitals, schools, and people fall within flood zones. An impact summary is generated including economic damage estimates.",
    technical:"IMD thresholds (Dist. Circular 2021). Population data: Census 2011 + WorldPop. Road/building data: OpenStreetMap. Economic: district GDP estimates.",
  },
  {
    n:"06", icon:"🔬", title:"Explainable AI (SHAP)",
    color:"#EF4444",
    desc:"Every prediction includes SHAP (SHapley Additive exPlanations) values showing exactly which atmospheric conditions drove the warning. Forecasters and researchers can inspect why the model made each decision — no more black boxes.",
    technical:"SHAP library: TreeSHAP for XGBoost, KernelSHAP for neural models. 8 key features visualized. Stored with each prediction in MongoDB.",
  },
  {
    n:"07", icon:"📱", title:"Multi-Channel Alert Dispatch",
    color:"#FBB724",
    desc:"When a warning crosses critical thresholds, the alert dispatcher queries all subscribers for that district. In parallel: Twilio SMS, Twilio WhatsApp, Resend email, and Firebase push notifications are dispatched. Messages are auto-translated by Gemini AI into the user's preferred language.",
    technical:"SMS/WhatsApp: Twilio API. Email: Resend. Push: FCM. Translation: Google Gemini. Average dispatch time: 20 seconds for 50,000 users.",
  },
  {
    n:"08", icon:"🙏", title:"Life Saved",
    color:"#22C55E",
    desc:"The entire pipeline from satellite data to your phone completes in under 30 seconds. With 6 hours of advance warning, communities can evacuate safely. Studies show 6-hour warnings reduce flood fatalities by up to 50%. VARSHANETRA provides up to 72-hour warnings.",
    technical:"Research basis: WMO Early Warning Systems framework. Lead time improvement: 12-72h vs current 2-12h. Lives saved estimate: 500+ annually with full deployment.",
  },
];

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => setActiveStep(s => (s + 1) % STEPS.length), 3000);
    return () => clearInterval(t);
  }, [autoPlay]);

  return (
    <div className="min-h-screen" style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="mt-16">
        {/* Hero */}
        <section className="py-16 text-center px-6">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold mb-5"
            style={{ background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.3)", color:"#00D4FF" }}>
            ⚙️ REAL-TIME INTELLIGENCE PIPELINE
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4">How VARSHANETRA Works</h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color:"var(--text-secondary)" }}>
            From satellite to your phone in under 30 seconds — the complete AI weather intelligence pipeline explained
          </p>
        </section>

        {/* Pipeline Steps */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          {/* Step selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-center flex-wrap">
            {STEPS.map((s, i) => (
              <button key={i}
                onClick={() => { setActiveStep(i); setAutoPlay(false); }}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: activeStep === i ? `${s.color}20` : "var(--bg-card)",
                  border:`1px solid ${activeStep === i ? s.color+"60" : "var(--border)"}`,
                  color: activeStep === i ? s.color : "var(--text-secondary)",
                }}>
                {s.n}
              </button>
            ))}
            <button onClick={() => setAutoPlay(!autoPlay)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color: autoPlay ? "#22C55E" : "var(--text-secondary)" }}>
              {autoPlay ? "⏸️ Pause" : "▶️ Auto"}
            </button>
          </div>

          {/* Active step detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background:`${STEPS[activeStep].color}15`, border:`2px solid ${STEPS[activeStep].color}40` }}>
                  {STEPS[activeStep].icon}
                </div>
                <div>
                  <span className="text-xs font-bold" style={{ color:STEPS[activeStep].color }}>STEP {STEPS[activeStep].n}</span>
                  <h2 className="text-2xl font-black">{STEPS[activeStep].title}</h2>
                </div>
              </div>
              <p className="text-base leading-relaxed mb-6" style={{ color:"var(--text-secondary)" }}>
                {STEPS[activeStep].desc}
              </p>
              <div className="p-4 rounded-xl" style={{ background:"var(--bg-card)", border:`1px solid ${STEPS[activeStep].color}20` }}>
                <p className="text-xs font-bold uppercase mb-2" style={{ color:STEPS[activeStep].color }}>Technical Implementation</p>
                <p className="text-sm" style={{ color:"var(--text-secondary)" }}>{STEPS[activeStep].technical}</p>
              </div>
            </div>

            {/* Visual flow indicator */}
            <div className="flex flex-col gap-2">
              {STEPS.map((s, i) => (
                <div key={i} onClick={() => { setActiveStep(i); setAutoPlay(false); }}
                  className="p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3"
                  style={{
                    background: activeStep === i ? `${s.color}10` : "var(--bg-card)",
                    border:`1px solid ${activeStep === i ? s.color+"40" : "var(--border)"}`,
                    transform: activeStep === i ? "scale(1.01)" : "scale(1)",
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background:`${s.color}15` }}>{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: activeStep === i ? s.color : "var(--text-primary)" }}>{s.title}</p>
                  </div>
                  <span className="text-xs font-black flex-shrink-0" style={{ color: i < activeStep ? "#22C55E" : activeStep === i ? s.color : "var(--text-tertiary)" }}>
                    {i < activeStep ? "✓" : activeStep === i ? "●" : s.n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Time breakdown */}
          <div className="p-6 rounded-2xl mb-12" style={{ background:"var(--bg-card)", border:"1px solid rgba(0,212,255,0.2)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color:"#00D4FF" }}>⏱️ Total Pipeline: Under 30 Seconds</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label:"Data fetch",     time:"0–5s",  color:"#00D4FF" },
                { label:"AI inference",   time:"5–15s", color:"#A855F7" },
                { label:"Warning creation",time:"15–20s",color:"#F97316" },
                { label:"Alert dispatch", time:"20–30s",color:"#22C55E" },
              ].map(t => (
                <div key={t.label} className="text-center p-4 rounded-xl" style={{ background:"var(--bg-elevated)", border:`1px solid ${t.color}20` }}>
                  <p className="text-xl font-black" style={{ color:t.color }}>{t.time}</p>
                  <p className="text-xs mt-1" style={{ color:"var(--text-secondary)" }}>{t.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/register">
              <button className="btn-neon px-10 py-4 text-base font-black rounded-xl mr-4">🚀 Get Protected Now</button>
            </Link>
            <Link href="/ai-observatory">
              <button className="btn-outline px-8 py-4 text-base font-bold rounded-xl">🧠 Watch AI in Action</button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
