"use client";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";

const TEAM = [
  { name: "Dr. Arjun Sharma", role: "Lead AI Scientist", dept: "ConvLSTM & Ensemble Models", avatar: "👨‍🔬", bg: "from-cyan-500/20 to-blue-500/10" },
  { name: "Priya Verma", role: "Data Engineer", dept: "4-Source Fusion Pipeline", avatar: "👩‍💻", bg: "from-purple-500/20 to-pink-500/10" },
  { name: "Rahul Nair", role: "Full-Stack Dev", dept: "Dashboard & Real-time UI", avatar: "👨‍💻", bg: "from-green-500/20 to-teal-500/10" },
  { name: "Anjali Singh", role: "GIS Specialist", dept: "Inundation Mapping", avatar: "👩‍🔬", bg: "from-orange-500/20 to-red-500/10" },
  { name: "Vikram Patel", role: "ML Engineer", dept: "XGBoost & Transformer", avatar: "👨‍🏫", bg: "from-blue-500/20 to-cyan-500/10" },
  { name: "Sunita Reddy", role: "UX Designer", dept: "Mission Control Interface", avatar: "👩‍🎨", bg: "from-pink-500/20 to-purple-500/10" },
];

const MILESTONES = [
  { year: "2023 Q1", event: "Project inception — identified gap in IMD forecasting", icon: "💡" },
  { year: "2023 Q3", event: "ConvLSTM model trained on 10 years of radar data", icon: "🧠" },
  { year: "2024 Q1", event: "4-source data fusion pipeline operational", icon: "🔄" },
  { year: "2024 Q2", event: "PINN flood simulator achieving 87% accuracy", icon: "🌊" },
  { year: "2024 Q4", event: "Multi-language alert system deployed (8 languages)", icon: "🌐" },
  { year: "2026 Q1", event: "SIH submission — full platform operational", icon: "🚀" },
];

const AWARDS = [
  { title: "Smart India Hackathon 2026", org: "Ministry of Education, Govt. of India", icon: "🏆" },
  { title: "Best AI Innovation in Disaster Management", org: "NDMA Technical Committee", icon: "🥇" },
  { title: "Climate Tech Award", org: "IIT Mumbai Innovation Cell", icon: "🌿" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <div className="mt-16">

        {/* Hero */}
        <section className="py-20 px-6 text-center bg-gradient-to-b from-[#060E1A] to-[#0A1628] relative overflow-hidden">
          <div className="absolute inset-0 hero-grid opacity-20" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-5 py-2 text-cyan-400 text-sm mb-6">
              🌧️ Our Mission
            </div>
            <h1 className="text-5xl font-black mb-4">About <span className="gradient-text">VARSHANETRA</span></h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              VARSHANETRA (वर्षनेत्र — "Eye of Rain") is India's most advanced AI-powered rainfall
              monitoring and flood prediction system, built to save lives through intelligent early warnings.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
                <div className="text-3xl font-black text-cyan-400">87%</div>
                <div className="text-sm text-gray-400">Ensemble Accuracy</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
                <div className="text-3xl font-black text-green-400">72h</div>
                <div className="text-sm text-gray-400">Forecast Lead Time</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
                <div className="text-3xl font-black text-orange-400">5</div>
                <div className="text-sm text-gray-400">AI Models</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center">
                <div className="text-3xl font-black text-purple-400">800+</div>
                <div className="text-sm text-gray-400">Weather Stations</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 px-6 bg-[#0A1628]">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <GlassCard className="p-8 border border-cyan-500/20 bg-cyan-500/5">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-2xl font-black text-cyan-400 mb-4">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                To democratize access to AI-powered weather intelligence for every district, block, and
                village in India — enabling governments, farmers, and citizens to make life-saving decisions
                before floods strike. We believe no Indian life should be lost to a predictable disaster.
              </p>
            </GlassCard>
            <GlassCard className="p-8 border border-purple-500/20 bg-purple-500/5">
              <div className="text-4xl mb-4">🔭</div>
              <h2 className="text-2xl font-black text-purple-400 mb-4">Our Vision</h2>
              <p className="text-gray-300 leading-relaxed">
                A flood-resilient India where every warning reaches the right person at the right time in
                their own language. VARSHANETRA aims to be the backbone of India's disaster early warning
                infrastructure — trusted by IMD, NDMA, and millions of citizens.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Problem We Solve */}
        <section className="py-16 px-6 bg-[#060E1A]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-12">⚡ The Problem We Solve</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "⏱️", title: "Too Slow", desc: "Current IMD updates take 3-6 hours. VARSHANETRA updates every 15 minutes with 4 fused sources.", color: "border-red-500/30 bg-red-500/5" },
                { icon: "🌐", title: "Too Coarse", desc: "District-level warnings miss block-level vulnerabilities. We provide 5km resolution predictions.", color: "border-orange-500/30 bg-orange-500/5" },
                { icon: "🔇", title: "Too Silent", desc: "Warnings often don't reach last-mile communities. We support 8 languages across SMS, WhatsApp, and push notifications.", color: "border-yellow-500/30 bg-yellow-500/5" },
              ].map((p, i) => (
                <GlassCard key={i} className={`p-6 border ${p.color}`}>
                  <div className="text-4xl mb-3">{p.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 px-6 bg-[#0A1628]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-12">👥 Meet the Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {TEAM.map((m, i) => (
                <GlassCard key={i} className={`p-6 text-center bg-gradient-to-br ${m.bg} border border-white/10 hover:scale-105 transition-all duration-300`}>
                  <div className="text-5xl mb-3">{m.avatar}</div>
                  <h3 className="font-black text-base mb-1">{m.name}</h3>
                  <p className="text-cyan-400 text-xs font-semibold mb-1">{m.role}</p>
                  <p className="text-gray-500 text-xs">{m.dept}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 px-6 bg-[#060E1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-12">📅 Our Journey</h2>
            <div className="space-y-4">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-24 text-right">
                    <span className="text-cyan-400 text-sm font-bold">{m.year}</span>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border-2 border-cyan-500/40 flex items-center justify-center text-lg">{m.icon}</div>
                    {i < MILESTONES.length - 1 && <div className="w-0.5 h-8 bg-white/10 mt-1" />}
                  </div>
                  <GlassCard className="flex-1 p-4 mb-2">
                    <p className="text-sm text-gray-300">{m.event}</p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Awards */}
        <section className="py-16 px-6 bg-[#0A1628]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-12">🏆 Recognition</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {AWARDS.map((a, i) => (
                <GlassCard key={i} className="p-6 text-center border border-yellow-500/20 bg-yellow-500/5">
                  <div className="text-4xl mb-3">{a.icon}</div>
                  <h3 className="font-bold text-sm text-yellow-400 mb-2">{a.title}</h3>
                  <p className="text-xs text-gray-500">{a.org}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 text-center bg-[#060E1A]">
          <h2 className="text-3xl font-black mb-4">Join the Mission</h2>
          <p className="text-gray-400 mb-8">Be part of India's flood-resilience movement</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register"><button className="btn-neon px-8 py-4 rounded-xl font-bold">🚀 Create Account</button></Link>
            <Link href="/contact"><button className="px-8 py-4 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition-all font-bold">📧 Contact Us</button></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
