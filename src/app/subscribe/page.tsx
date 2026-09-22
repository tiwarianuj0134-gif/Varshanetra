"use client";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const LANGUAGES = ["English", "हिंदी", "मराठी", "বাংলা", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "മലയാളം"];
const CHANNELS = [
  { id: "sms", label: "💬 SMS", desc: "Plain text SMS to your mobile" },
  { id: "whatsapp", label: "📱 WhatsApp", desc: "Rich messages with maps" },
  { id: "email", label: "📧 Email", desc: "Detailed email report" },
  { id: "push", label: "🔔 Push", desc: "Browser/App notification" },
];

const STATES = [...new Set(INDIAN_DISTRICTS.map(d => d.state))].sort();

export default function SubscribePage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(user?.mobile?.replace("+91", "") || "");
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.name || "");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState("");
  const [alertLevels, setAlertLevels] = useState<string[]>(["RED", "ORANGE"]);
  const [channels, setChannels] = useState<string[]>(["sms"]);
  const [language, setLanguage] = useState(user?.language || "English");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const toggleDistrict = (code: string) => {
    setSelectedDistricts(prev =>
      prev.includes(code) ? prev.filter(d => d !== code) : prev.length < 5 ? [...prev, code] : prev
    );
  };

  const toggleLevel = (level: string) => {
    if (level === "RED") return;
    setAlertLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.match(/^[6-9]\d{9}$/)) { setError("Invalid mobile number (10 digits starting with 6-9)"); return; }
    if (selectedDistricts.length === 0) { setError("Select at least one district"); return; }
    if (channels.length === 0) { setError("Select at least one alert channel"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: `+91${phone}`,
          email: email || undefined,
          name,
          districts: selectedDistricts,
          alertLevels,
          channels,
          language,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setStep(5);
      } else {
        const d = await res.json();
        setError(d.error || "Subscription failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  const filteredDistricts = stateFilter
    ? INDIAN_DISTRICTS.filter(d => d.state === stateFilter)
    : INDIAN_DISTRICTS;

  const STEP_LABELS = ["Contact", "Locations", "Levels", "Channels", "Done"];
  const selectedDistrictNames = selectedDistricts.map(code => INDIAN_DISTRICTS.find(d => d.code === code)?.name || code);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <div className="mt-16 max-w-2xl mx-auto p-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔔</div>
          <h1 className="text-4xl font-black mb-2">Get Rainfall & Flood Alerts</h1>
          <p className="text-gray-400 text-lg">Receive AI-powered early warnings directly on your device — free service</p>
          {user && (
            <div className="inline-flex items-center gap-2 mt-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2 text-sm text-green-400">
              ✅ Logged in as {user.name} · Your details are pre-filled
            </div>
          )}
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                step > i + 1 ? "bg-green-500 text-white" :
                step === i + 1 ? "bg-cyan-500 text-white ring-2 ring-cyan-500/30" :
                "bg-white/10 text-gray-500"
              }`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`ml-1.5 text-xs mr-2 hidden sm:block ${step === i + 1 ? "text-cyan-400 font-bold" : "text-gray-500"}`}>
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-6 h-px mr-2 ${step > i + 1 ? "bg-green-500" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm text-center font-medium">
            ⚠️ {error}
          </div>
        )}

        <GlassCard className="p-6">

          {/* STEP 1 — Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl mb-5">📱 Step 1: Contact Details</h2>
              <div>
                <label className="text-sm text-gray-400 block mb-1.5 font-medium">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="Enter your name" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1.5 font-medium">Mobile Number *</label>
                <div className="flex">
                  <span className="bg-white/8 border border-r-0 border-white/15 rounded-l-xl px-4 py-3 text-gray-400 text-sm font-bold">+91</span>
                  <input required value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 bg-white/8 border border-white/15 rounded-r-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-all"
                    placeholder="10-digit mobile number" maxLength={10} />
                </div>
                <p className="text-xs text-gray-500 mt-1">OTP will NOT be sent for alert subscription. Number used only for SMS alerts.</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1.5 font-medium">Email Address (optional)</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-all"
                  placeholder="your@email.com" />
              </div>
              <button
                onClick={() => {
                  if (!phone.match(/^[6-9]\d{9}$/)) { setError("Enter a valid 10-digit mobile number"); return; }
                  setError(""); setStep(2);
                }}
                className="w-full btn-neon py-3 rounded-xl font-bold">
                Next: Select Districts →
              </button>
            </div>
          )}

          {/* STEP 2 — Districts */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-xl mb-2">📍 Step 2: Select Districts (max 5)</h2>
              <p className="text-xs text-gray-400 mb-4">You&apos;ll receive alerts when warnings are issued for these districts</p>

              {/* State filter */}
              <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none mb-3">
                <option value="" className="bg-[#0A1628]">All States</option>
                {STATES.map(s => <option key={s} value={s} className="bg-[#0A1628]">{s}</option>)}
              </select>

              <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto scrollbar-thin mb-4">
                {filteredDistricts.map(d => (
                  <button key={d.code} onClick={() => toggleDistrict(d.code)}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs transition-all border ${
                      selectedDistricts.includes(d.code)
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-white/4 border-white/10 text-gray-400 hover:bg-white/8"
                    } ${selectedDistricts.length >= 5 && !selectedDistricts.includes(d.code) ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <p className="font-bold text-white text-xs">{d.name}</p>
                    <p className="text-gray-500 text-xs">{d.state}</p>
                  </button>
                ))}
              </div>

              {selectedDistricts.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedDistrictNames.map((n, i) => (
                    <span key={i} className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      📍 {n}
                      <button onClick={() => toggleDistrict(selectedDistricts[i])} className="ml-1 hover:text-white">✕</button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-cyan-400 mb-4 font-semibold">{selectedDistricts.length}/5 districts selected</p>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-white/8 font-medium hover:bg-white/12 transition-all text-sm">← Back</button>
                <button onClick={() => { if (selectedDistricts.length === 0) { setError("Select at least one district"); return; } setError(""); setStep(3); }}
                  disabled={selectedDistricts.length === 0}
                  className="flex-1 btn-neon py-3 rounded-xl font-bold disabled:opacity-50 text-sm">
                  Next: Alert Levels →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Levels */}
          {step === 3 && (
            <div>
              <h2 className="font-bold text-xl mb-5">⚠️ Step 3: Alert Levels</h2>
              <div className="space-y-3 mb-6">
                {[
                  { level: "RED", label: "🔴 RED Warnings — Extremely Heavy Rain (>204mm)", required: true, desc: "Life-threatening conditions, mandatory" },
                  { level: "ORANGE", label: "🟠 ORANGE Alerts — Very Heavy Rain (115-204mm)", desc: "Significant disruption likely" },
                  { level: "YELLOW", label: "🟡 YELLOW Watch — Heavy Rain (64-115mm)", desc: "Moderate impact, stay informed" },
                  { level: "FLOOD", label: "🌊 Flood Alerts — River/Flash Flooding", desc: "Specific flood events in your districts" },
                ].map(item => (
                  <label key={item.level}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      alertLevels.includes(item.level) || item.required
                        ? "bg-white/8 border-white/20" : "bg-white/4 border-white/8 hover:bg-white/6"
                    }`}>
                    <input type="checkbox"
                      checked={alertLevels.includes(item.level) || item.required || false}
                      onChange={() => toggleLevel(item.level)}
                      disabled={item.required}
                      className="accent-cyan-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    {item.required && <span className="ml-auto text-xs text-red-400 font-bold flex-shrink-0">Required</span>}
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-white/8 font-medium hover:bg-white/12 transition-all text-sm">← Back</button>
                <button onClick={() => setStep(4)} className="flex-1 btn-neon py-3 rounded-xl font-bold text-sm">Next: Delivery Channels →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Channels + Language */}
          {step === 4 && (
            <form onSubmit={handleSubmit}>
              <h2 className="font-bold text-xl mb-5">📱 Step 4: Delivery Preferences</h2>

              <div className="mb-5">
                <label className="text-sm text-gray-400 block mb-3 font-medium">Alert Channels (select all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.map(ch => (
                    <label key={ch.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        channels.includes(ch.id) ? "bg-cyan-500/10 border-cyan-500/40" : "bg-white/4 border-white/8 hover:bg-white/8"
                      }`}>
                      <input type="checkbox" checked={channels.includes(ch.id)} onChange={() => toggleChannel(ch.id)} className="accent-cyan-500" />
                      <div>
                        <p className="text-sm font-semibold text-white">{ch.label}</p>
                        <p className="text-xs text-gray-500">{ch.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm text-gray-400 block mb-3 font-medium">🌐 Alert Language</label>
                <div className="grid grid-cols-4 gap-2">
                  {LANGUAGES.map(lang => (
                    <button type="button" key={lang} onClick={() => setLanguage(lang)}
                      className={`py-2.5 rounded-xl border text-sm transition-all font-medium ${
                        language === lang ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-white/4 border-white/10 text-gray-400 hover:bg-white/8"
                      }`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <GlassCard className="p-4 mb-5 border border-green-500/20 bg-green-500/5">
                <p className="text-xs font-bold text-green-400 mb-2">📱 Sample Alert Preview ({language}):</p>
                <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {language === "हिंदी"
                      ? `🔴 VARSHANETRA चेतावनी: ${selectedDistrictNames[0] || "आपके जिले"} में अत्यधिक भारी वर्षा (200मिमी+) की संभावना। जनसंख्या प्रभावित: 12L+ | AI विश्वास: 87%`
                      : `🔴 VARSHANETRA ALERT: Extremely Heavy Rainfall (200mm+) expected in ${selectedDistrictNames[0] || "your district"} in next 24h. Pop. at Risk: 12L+ | AI Confidence: 87% | Details: varshanetra.imd.gov.in`
                    }
                  </p>
                </div>
              </GlassCard>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-white/8 font-medium hover:bg-white/12 transition-all text-sm">← Back</button>
                <button type="submit" disabled={submitting || channels.length === 0}
                  className="flex-1 btn-neon py-3 rounded-xl font-black disabled:opacity-50">
                  {submitting ? "⏳ Subscribing..." : "🔔 Subscribe Now"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5 — Success */}
          {step === 5 && success && (
            <div className="text-center py-8">
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-3xl font-black text-green-400 mb-2">You&apos;re Subscribed!</h2>
              <p className="text-gray-300 mb-1">
                Alerts set up for <strong className="text-cyan-400">{selectedDistricts.length} district{selectedDistricts.length > 1 ? "s" : ""}</strong>
              </p>
              <p className="text-gray-400 text-sm mb-6">
                via <strong>{channels.join(", ")}</strong> in <strong>{language}</strong>
              </p>

              {/* Summary */}
              <div className="bg-white/5 rounded-xl p-4 text-left mb-6 border border-green-500/20">
                <p className="text-xs text-gray-400 font-bold uppercase mb-3">Subscription Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Mobile</span><span className="text-white">+91 {phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Districts</span><span className="text-cyan-400">{selectedDistrictNames.join(", ")}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Alert Levels</span><span className="text-white">{alertLevels.join(", ")}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Channels</span><span className="text-white">{channels.join(", ")}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Language</span><span className="text-white">{language}</span></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/dashboard">
                  <button className="btn-neon px-8 py-3 rounded-xl font-bold">🚀 Go to Dashboard</button>
                </Link>
                <button onClick={() => { setStep(1); setSuccess(false); setPhone(""); setSelectedDistricts([]); }}
                  className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition-all font-bold">
                  + Add Another Number
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Trust indicators */}
        <div className="mt-6 text-center text-xs text-gray-600 space-y-1">
          <p>🔒 Free service by India Meteorological Department & VARSHANETRA</p>
          <p>No spam. Unsubscribe anytime by replying STOP to any SMS.</p>
        </div>
      </div>
    </div>
  );
}
