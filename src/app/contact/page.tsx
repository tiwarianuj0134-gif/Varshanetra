"use client";
import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function ContactPage() {
  const [form, setForm] = useState({ name:"", email:"", subject:"general", message:"" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen" style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="mt-16 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold mb-5"
            style={{ background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.3)", color:"#00D4FF" }}>
            📞 GET IN TOUCH
          </div>
          <h1 className="text-5xl font-black mb-3">Contact VARSHANETRA</h1>
          <p className="text-lg" style={{ color:"var(--text-secondary)" }}>Questions, partnerships, or feedback — we&apos;re here</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <div className="p-6 rounded-2xl" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
            <h2 className="text-xl font-black mb-5">Send a Message</h2>
            {sent ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-xl font-bold mb-2" style={{ color:"#22C55E" }}>Message Sent!</p>
                <p style={{ color:"var(--text-secondary)" }}>We'll get back to you within 24 hours</p>
                <button onClick={() => { setSent(false); setForm({ name:"", email:"", subject:"general", message:"" }); }}
                  className="mt-6 btn-outline px-6 py-2 rounded-xl text-sm font-semibold">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color:"var(--text-secondary)" }}>Full Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({...form, name:e.target.value})}
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", color:"var(--text-primary)" }}
                      onFocus={e => e.target.style.borderColor = "#00D4FF"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color:"var(--text-secondary)" }}>Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", color:"var(--text-primary)" }}
                      onFocus={e => e.target.style.borderColor = "#00D4FF"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1.5" style={{ color:"var(--text-secondary)" }}>Subject</label>
                  <select value={form.subject} onChange={e => setForm({...form, subject:e.target.value})}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", color:"var(--text-primary)" }}>
                    <option value="general">General Inquiry</option>
                    <option value="partnership">Government Partnership</option>
                    <option value="research">Research Collaboration</option>
                    <option value="technical">Technical Support</option>
                    <option value="media">Media / Press</option>
                    <option value="feedback">Feedback / Bug Report</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1.5" style={{ color:"var(--text-secondary)" }}>Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message:e.target.value})}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                    style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", color:"var(--text-primary)" }}
                    onFocus={e => e.target.style.borderColor = "#00D4FF"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <button type="submit" disabled={sending} className="w-full btn-neon py-3 text-base font-black rounded-xl">
                  {sending ? "⏳ Sending..." : "📨 Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-5">
            {[
              { icon:"🏛️", title:"Government Partnerships", desc:"Ministry of Earth Sciences (MoES) · India Meteorological Department · NDMA · SDMA", info:"Contact: partnerships@varshanetra.in", color:"#00D4FF" },
              { icon:"🔬", title:"Research Collaboration", desc:"IIT / IISc / IMD Scientists — access our dataset, API, and ML models for research", info:"research@varshanetra.in · ORCID integration available", color:"#A855F7" },
              { icon:"📰", title:"Media & Press", desc:"For press inquiries, interview requests, or demo arrangements", info:"media@varshanetra.in", color:"#22C55E" },
              { icon:"🆘", title:"Technical Support", desc:"Having issues with alerts, account, or app?", info:"support@varshanetra.in · Emergency: 1078", color:"#F97316" },
            ].map((c, i) => (
              <div key={i} className="p-5 rounded-2xl transition-all"
                style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.color+"40"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{c.icon}</span>
                  <div>
                    <h3 className="font-bold mb-1">{c.title}</h3>
                    <p className="text-sm mb-1" style={{ color:"var(--text-secondary)" }}>{c.desc}</p>
                    <p className="text-xs font-semibold" style={{ color:c.color }}>{c.info}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Social & Links */}
            <div className="p-5 rounded-2xl" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
              <h3 className="font-bold mb-3">Find Us</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label:"🐦 Twitter/X", href:"#" },
                  { label:"💼 LinkedIn", href:"#" },
                  { label:"💻 GitHub", href:"#" },
                  { label:"📖 Docs", href:"#" },
                ].map(s => (
                  <a key={s.label} href={s.href}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", color:"var(--text-secondary)" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#00D4FF"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl text-center" style={{ background:"rgba(0,212,255,0.05)", border:"1px solid rgba(0,212,255,0.2)" }}>
              <p className="text-sm font-bold mb-2" style={{ color:"#00D4FF" }}>🏆 Smart India Hackathon 2026</p>
              <p className="text-xs" style={{ color:"var(--text-secondary)" }}>Problem Statement 26071 · Ministry of Earth Sciences · India Meteorological Department</p>
              <p className="text-xs mt-1" style={{ color:"var(--text-tertiary)" }}>Made with ❤️ for India by Team VARSHANETRA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
