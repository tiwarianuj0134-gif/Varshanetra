"use client";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";

const TIERS = [
  {
    tier: "TIER 1",
    title: "Multi-Modal Earth Observation & Ingestion",
    icon: "🛰️",
    color: "border-cyan-500/50 bg-cyan-950/20 text-cyan-400",
    items: [
      { name: "INSAT-3D / 3DR Radiometer", desc: "10.8µm Thermal IR, 6.7µm Water Vapor, 0.65µm Visible (15-min rapid scans)" },
      { name: "IMD Doppler Weather Radar (DWR)", desc: "39 dual-polarization S/C-band radars, 3D volumetric reflectivity (dBZ)" },
      { name: "Surface AWS & ARG Stations", desc: "800+ automated weather stations reporting rainfall rate, humidity & pressure" },
      { name: "Numerical Weather Models (NWP)", desc: "NCMRWF Unified Model (4km) & GFS synoptic boundary forcing" },
    ],
  },
  {
    tier: "TIER 2",
    title: "AI/ML Ensemble & Physics Hydrodynamics Core",
    icon: "🧠",
    color: "border-purple-500/50 bg-purple-950/20 text-purple-400",
    items: [
      { name: "Spatiotemporal Transformer", desc: "Cross-attention neural architecture predicting 12h to 72h synoptic rain evolutions" },
      { name: "ConvLSTM Deep Nowcaster", desc: "Convolutional Recurrent Neural Network for 0-6h ultra-short lead nowcasting" },
      { name: "PINN Inundation Engine", desc: "Physics-Informed Neural Network solving 2D Saint-Venant shallow water equations" },
      { name: "Bayesian Model Averaging (BMA)", desc: "Uncertainty quantification with SHAP (Shapley Additive exPlanations) values" },
    ],
  },
  {
    tier: "TIER 3",
    title: "Disaster Risk & Early Warning Engine",
    icon: "⚠️",
    color: "border-amber-500/50 bg-amber-950/20 text-amber-400",
    items: [
      { name: "Dynamic Threshold Matrix", desc: "IMD Standard Warning levels (RED > 204.5mm, ORANGE > 115.6mm, YELLOW > 64.5mm)" },
      { name: "SRTM 30m Digital Elevation Model", desc: "Topographic flow accumulation, urban drainage culverts, and river basin crests" },
      { name: "Vulnerability Indexer", desc: "Overlays census population density, informal settlements, and hospital locations" },
    ],
  },
  {
    tier: "TIER 4",
    title: "Multi-Channel Dissemination & Action",
    icon: "📱",
    color: "border-green-500/50 bg-green-950/20 text-green-400",
    items: [
      { name: "Common Alerting Protocol (CAP)", desc: "Cell broadcast & automated SMS alerts pushed to citizens in high-risk zones" },
      { name: "VARSHA AI Conversational Assistant", desc: "Multi-lingual emergency chatbot delivering localized farm & safety advice" },
      { name: "Government Command Center", desc: "Direct dashboard for Collectors, NDMA, and SDRF troop positioning" },
      { name: "Automated IMD Bulletins", desc: "Instant official PDF flood bulletins with meteorological charts and relief maps" },
    ],
  },
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen text-gray-200 flex flex-col bg-transparent">
      <Navbar />

      <main className="mt-16 flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-[#0A1628] to-purple-950/40 p-6 rounded-2xl border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
              SYSTEM ARCHITECTURE & PIPELINE
            </span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            🏗️ VARSHANETRA Technical Architecture & Data Ingestion Pipeline
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            End-to-end integration: Multi-satellite telemetry → AI/ML nowcasting → Physics-informed flood propagation → Common Alerting Protocol dispatch
          </p>
        </div>

        {/* 4-Tier Pipeline Cards */}
        <div className="space-y-6">
          {TIERS.map((tier, idx) => (
            <div key={tier.tier} className="relative">
              <GlassCard className={`p-6 border-2 ${tier.color}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tier.icon}</span>
                    <div>
                      <span className="text-[10px] font-mono uppercase font-black tracking-widest text-cyan-400">
                        {tier.tier}
                      </span>
                      <h3 className="text-xl font-black text-white">{tier.title}</h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1 rounded-lg border border-white/10 self-start sm:self-auto">
                    Latency: {idx === 0 ? "15-min batch" : idx === 1 ? "<400ms inference" : idx === 2 ? "<50ms rule eval" : "Real-time push"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {tier.items.map((item, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-xs text-gray-300 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Connecting Pipe Down Arrow */}
              {idx < TIERS.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="px-4 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-black animate-bounce">
                    ↓ Stream Ingestion Pipe
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Technical Deep Dive Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-5 border-l-4 border-l-cyan-500">
            <h4 className="font-bold text-white mb-2">⚡ Low-Latency Scaling</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Inference runs on optimized ONNX / TensorRT runtime kernels. Multi-threaded spatial mosaicing processes raw NetCDF-4 grids in under 400 milliseconds.
            </p>
          </GlassCard>

          <GlassCard className="p-5 border-l-4 border-l-purple-500">
            <h4 className="font-bold text-white mb-2">🛡️ Fault Tolerant Resilience</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              If satellite feeds experience outage, the system smoothly falls back to Doppler radar mosaicing and ground AWS spatial interpolation with zero downtime.
            </p>
          </GlassCard>

          <GlassCard className="p-5 border-l-4 border-l-green-500">
            <h4 className="font-bold text-white mb-2">🌐 Open Standards & CAP</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Implements ITU-T X.1303 Common Alerting Protocol (CAP-IN v1.0) and OGC WMS/WFS geospatial standards for seamless inter-agency interoperability.
            </p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
