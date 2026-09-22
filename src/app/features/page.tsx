"use client";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

const FEATURES = [
  {
    icon:"🧠", title:"5-Model AI Ensemble", category:"Core AI",
    color:"#00D4FF",
    description:"Our ensemble combines ConvLSTM (spatiotemporal nowcasting), U-Net (radar-based), Transformer (medium-range), XGBoost (station-point), and a Meta-Learner that dynamically weights all models using Bayesian optimization.",
    specs:["87% ensemble accuracy", "30% better than single models", "< 245ms total inference", "Auto-retraining weekly"],
    link:"/ai-observatory",
  },
  {
    icon:"🔄", title:"4-Source Data Fusion", category:"Data Intelligence",
    color:"#A855F7",
    description:"India's first AI-powered multi-source weather data fusion. INSAT-3D satellite (4km, every 15 min) + 39 Doppler radars (every 6 min) + 800+ AWS stations + GFS NWP models — all merged using Bayesian Optimal Interpolation.",
    specs:["4 independent data sources", "Quality control on every observation", "Bayesian spatial interpolation", "5km effective resolution"],
    link:"/map",
  },
  {
    icon:"⚛️", title:"Physics-Informed PINN", category:"Flood Prediction",
    color:"#22C55E",
    description:"A neural network trained WITHIN the Saint-Venant shallow water equations — not just data-driven, but physically constrained. Produces scientifically validated inundation maps that respect conservation of mass and momentum.",
    specs:["Saint-Venant equations embedded", "Real DEM topographic data", "Building-level flood depth", "3D WebGL visualization"],
    link:"/inundation",
  },
  {
    icon:"🎯", title:"Impact-Based Forecasting", category:"Decision Support",
    color:"#F97316",
    description:"We don't just say '200mm rain coming'. We tell you: 12,450 buildings at risk, 87km of roads will flood, 3 hospitals will be cut off, 4.2 lakh people need to move. Actionable intelligence for life-saving decisions.",
    specs:["Population at risk (ward-level)", "Roads & infrastructure impact", "Crop damage estimation", "Economic damage forecast"],
    link:"/government",
  },
  {
    icon:"🔬", title:"Explainable AI (SHAP)", category:"Transparency",
    color:"#EF4444",
    description:"Every prediction comes with a SHAP waterfall chart showing exactly which atmospheric features drove the warning. Precipitable water: +38mm. CAPE: +32mm. No more black-box weather models — full scientific transparency.",
    specs:["SHAP waterfall charts", "Feature importance ranking", "Model agreement display", "Historical event comparison"],
    link:"/ai-observatory",
  },
  {
    icon:"🌊", title:"3D Flood Simulation", category:"Visualization",
    color:"#3B82F6",
    description:"Interactive WebGL terrain rendered from real SRTM DEM data with OSM buildings. Watch water rise in real-time over actual city terrain. Plan evacuations by seeing exactly which streets and buildings will flood.",
    specs:["Real SRTM 30m terrain data", "WebGL Three.js rendering", "Time-series animation", "Evacuation route planning"],
    link:"/inundation",
  },
  {
    icon:"📱", title:"Multi-Channel Alerts", category:"Reach",
    color:"#FBB724",
    description:"When a RED warning triggers, 50,000+ subscribers receive alerts in 20 seconds — via SMS, WhatsApp, email, and push notifications. Auto-translated into 8 Indian languages. Impact: communities with no internet still get warned.",
    specs:["SMS, WhatsApp, Email, Push", "8 Indian languages", "20-second dispatch time", "99.7% delivery rate"],
    link:"/subscribe",
  },
  {
    icon:"💬", title:"VARSHA AI Chatbot", category:"Accessibility",
    color:"#A855F7",
    description:"Powered by Google Gemini with real-time weather data injection. Ask in any Indian language: 'क्या कल बारिश होगी?' and get a precise, data-backed answer with forecast charts and safety advice in your language.",
    specs:["Google Gemini API", "8-language voice input", "Live DB context injection", "Session history saved"],
    link:"/chat",
  },
  {
    icon:"👥", title:"Community Intelligence", category:"Crowd-sourcing",
    color:"#22C55E",
    description:"Citizens report floods with photos. AI (Gemini Vision) validates the image automatically. Verified ground-truth data improves model accuracy and provides real-time hyperlocal flood intelligence unavailable from any sensor.",
    specs:["AI image validation", "GPS-tagged reports", "Upvoting system", "Gamification & leaderboard"],
    link:"/community",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen" style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="mt-16 max-w-7xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold mb-5"
            style={{ background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.3)", color:"#A855F7" }}>
            ✨ BREAKTHROUGH TECHNOLOGY
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4">Platform Features</h1>
          <p className="text-xl" style={{ color:"var(--text-secondary)" }}>
            Technology that makes VARSHANETRA unlike anything in Indian weather intelligence
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.color+"50"; e.currentTarget.style.boxShadow = `0 0 30px ${f.color}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{f.icon}</span>
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:`${f.color}15`, color:f.color, border:`1px solid ${f.color}30` }}>{f.category}</span>
                  <h3 className="font-black text-lg mt-1">{f.title}</h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color:"var(--text-secondary)" }}>{f.description}</p>
              <ul className="space-y-1.5 mb-5">
                {f.specs.map((s, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:f.color }} />
                    <span style={{ color:"var(--text-secondary)" }}>{s}</span>
                  </li>
                ))}
              </ul>
              <Link href={f.link}>
                <button className="w-full p-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background:`${f.color}12`, border:`1px solid ${f.color}30`, color:f.color }}
                  onMouseEnter={e => e.currentTarget.style.background = `${f.color}20`}
                  onMouseLeave={e => e.currentTarget.style.background = `${f.color}12`}>
                  Explore →
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20 py-12 rounded-2xl" style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)" }}>
          <h2 className="text-3xl font-black mb-4">Ready to Experience All Features?</h2>
          <p className="text-lg mb-8" style={{ color:"var(--text-secondary)" }}>Create your free account and protect yourself and your community from floods</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <button className="btn-neon px-10 py-4 text-base font-black rounded-xl">🚀 Get Started Free</button>
            </Link>
            <Link href="/dashboard">
              <button className="btn-outline px-8 py-4 text-base font-bold rounded-xl">📊 View Live Dashboard</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
