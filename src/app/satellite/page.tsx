"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { LivePulse } from "@/components/ui/LivePulse";

interface BandInfo {
  id: string;
  name: string;
  satellite: string;
  wavelength: string;
  description: string;
  colorRamp: string;
  unit: string;
  range: string;
}

const BANDS: BandInfo[] = [
  { id: "tir1", name: "Thermal Infrared (TIR-1)", satellite: "INSAT-3D / 3DR", wavelength: "10.8 µm", description: "Detects cloud top temperature; deep convective storms appear bright purple/red", colorRamp: "Rainbow (180K - 320K)", unit: "Kelvin (K)", range: "190K to 310K" },
  { id: "wv", name: "Water Vapor Channel (WV)", satellite: "INSAT-3D", wavelength: "6.7 µm", description: "Measures mid-to-upper tropospheric moisture advection and jet stream dynamics", colorRamp: "Moisture Blue-Cyan", unit: "Kelvin (K)", range: "200K to 270K" },
  { id: "vis", name: "Visible Optical Channel (VIS)", satellite: "INSAT-3D", wavelength: "0.65 µm", description: "High-resolution cloud thickness, albedo, and cyclonic vortex eye structure", colorRamp: "Greyscale High-Contrast", unit: "Albedo %", range: "0% to 100%" },
  { id: "radar", name: "Doppler Weather Radar (DWR)", satellite: "IMD Radar Network (39 Stations)", wavelength: "S/C-Band", description: "Composite volumetric radar reflectivity (Z) indicating heavy precipitation core", colorRamp: "IMD Standard (10 - 65 dBZ)", unit: "dBZ", range: "10 dBZ to 65 dBZ" },
];

export default function SatellitePage() {
  const [activeBand, setActiveBand] = useState<string>("tir1");
  const [frameIndex, setFrameIndex] = useState(7); // 0 to 7 (8 time slices)
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>("all_india");
  const [showStations, setShowStations] = useState(true);

  const currentBandInfo = BANDS.find(b => b.id === activeBand) || BANDS[0];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % 8);
    }, 800);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const timestamps = [
    "02:00 UTC (07:30 IST)", "02:30 UTC (08:00 IST)", "03:00 UTC (08:30 IST)", "03:30 UTC (09:00 IST)",
    "04:00 UTC (09:30 IST)", "04:30 UTC (10:00 IST)", "05:00 UTC (10:30 IST)", "05:30 UTC (11:00 IST) [LATEST]",
  ];

  return (
    <div className="min-h-screen text-gray-200 flex flex-col bg-transparent">
      <Navbar />

      <main className="mt-16 flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/50 via-[#0A1628] to-cyan-950/40 p-6 rounded-2xl border border-cyan-500/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                EARTH OBSERVATION TELEMETRY
              </span>
              <LivePulse label="INSAT-3D GEOFTP" status="LIVE FEED" color="green" size="sm" />
            </div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              🛰️ INSAT-3D Satellite & Doppler Radar Multi-Spectral Viewer
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Direct geostationary radiometric imagery and ground Doppler radar reflectivity loops for nowcasting deep convection
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
            >
              🗺️ GIS Map View →
            </Link>
          </div>
        </div>

        {/* Band Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BANDS.map((band) => {
            const isSel = activeBand === band.id;
            return (
              <button
                key={band.id}
                onClick={() => setActiveBand(band.id)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSel
                    ? "bg-cyan-500/15 border-cyan-500/70 shadow-lg shadow-cyan-500/10"
                    : "bg-[#0A1628] hover:bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-cyan-400">{band.wavelength}</span>
                  {isSel && <span className="text-xs text-green-400 font-bold">● ACTIVE</span>}
                </div>
                <h4 className="font-black text-sm text-white">{band.name}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">{band.satellite}</p>
              </button>
            );
          })}
        </div>

        {/* Main Satellite Viewport & Side Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Center: Canvas / Imagery Viewport */}
          <div className="lg:col-span-8 space-y-4">
            <GlassCard className="p-4 border-cyan-500/30 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Frame {frameIndex + 1}/8:</span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">{timestamps[frameIndex]}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all_india" className="bg-[#0A1628]">All India Overview</option>
                    <option value="west_coast" className="bg-[#0A1628]">Konkan & Western Ghats</option>
                    <option value="north_east" className="bg-[#0A1628]">North-Eastern Region</option>
                    <option value="bay_bengal" className="bg-[#0A1628]">Bay of Bengal Monsoon Low</option>
                  </select>

                  <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showStations}
                      onChange={(e) => setShowStations(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    AWS Radar Overlays
                  </label>
                </div>
              </div>

              {/* Simulated Geo Radiometric Visual Canvas */}
              <div className="relative h-[420px] w-full rounded-xl bg-[#040C18] border border-white/10 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 700 450">
                  {/* Outer space background */}
                  <rect width="100%" height="100%" fill="#040C18" />

                  {/* India Coastline Outline Silhouette */}
                  <path
                    d="M 280 80 Q 320 120 310 160 Q 290 220 340 320 Q 350 370 330 420 Q 310 390 290 320 Q 250 250 240 210 Q 220 180 250 140 Z"
                    fill="#08182B"
                    stroke="#1E3A5F"
                    strokeWidth="2"
                  />

                  {/* Radiometric Cloud Storm Clusters animating with frameIndex */}
                  {/* Western Ghats Convective Band */}
                  <ellipse
                    cx={250 + (frameIndex * 2)}
                    cy={230 - (frameIndex * 3)}
                    rx={60 + (frameIndex * 4)}
                    ry={90 + (frameIndex * 3)}
                    fill={activeBand === "radar" ? "#EF4444" : activeBand === "wv" ? "#00D4FF" : "#A855F7"}
                    opacity={0.45 + (frameIndex * 0.04)}
                    className="filter blur-md transition-all duration-700"
                  />
                  <circle
                    cx={260 + (frameIndex * 2)}
                    cy={240 - (frameIndex * 2)}
                    r={35 + (frameIndex * 2)}
                    fill={activeBand === "radar" ? "#B91C1C" : "#EC4899"}
                    opacity={0.7}
                    className="filter blur-sm"
                  />

                  {/* Bay of Bengal Monsoon Depression */}
                  <ellipse
                    cx={440 - (frameIndex * 5)}
                    cy={210 - (frameIndex * 2)}
                    rx={80 + (frameIndex * 3)}
                    ry={70 + (frameIndex * 3)}
                    fill={activeBand === "radar" ? "#F59E0B" : activeBand === "vis" ? "#E2E8F0" : "#3B82F6"}
                    opacity={0.5}
                    className="filter blur-md"
                  />

                  {/* Doppler Radar Stations Overlays */}
                  {showStations && (
                    <>
                      {[
                        { x: 260, y: 220, name: "Mumbai DWR (S-Band)" },
                        { x: 290, y: 260, name: "Goa DWR" },
                        { x: 340, y: 310, name: "Chennai DWR" },
                        { x: 420, y: 190, name: "Kolkata DWR" },
                        { x: 290, y: 110, name: "Delhi DWR" },
                      ].map((stn, i) => (
                        <g key={i} transform={`translate(${stn.x}, ${stn.y})`}>
                          <circle r="6" fill="#00D4FF" stroke="#fff" strokeWidth="1.5" />
                          <circle r="22" fill="none" stroke="#00D4FF" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                          <text x="10" y="4" fill="#A5F3FC" fontSize="10" fontWeight="bold">{stn.name}</text>
                        </g>
                      ))}
                    </>
                  )}
                </svg>

                {/* Satellite Watermark */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-cyan-300">
                  {currentBandInfo.name} | {currentBandInfo.range}
                </div>

                {/* Color Ramp Scale Bar */}
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-[10px] min-w-[200px]">
                  <div className="flex justify-between text-gray-300 mb-1">
                    <span>Low ({activeBand === "radar" ? "10 dBZ" : "Warm"})</span>
                    <span>Extreme ({activeBand === "radar" ? "65 dBZ" : "Cold 190K"})</span>
                  </div>
                  <div
                    className="h-2.5 w-full rounded-full"
                    style={{
                      background: activeBand === "radar"
                        ? "linear-gradient(to right, #3B82F6, #10B981, #F59E0B, #EF4444, #7F1D1D)"
                        : "linear-gradient(to right, #1E3A8A, #0284C7, #06B6D4, #F43F5E, #881337)",
                    }}
                  />
                  <div className="text-center text-gray-400 mt-1 font-mono text-[9px]">
                    Calibration: {currentBandInfo.unit}
                  </div>
                </div>
              </div>

              {/* Timeline Animation Controls */}
              <div className="p-3 bg-[#071322] rounded-xl border border-white/10 mt-3 flex items-center justify-between gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs transition-all hover:opacity-90 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
                >
                  {isPlaying ? "⏸️ Pause Loop" : "▶️ Play Timeline"}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={7}
                    value={frameIndex}
                    onChange={(e) => {
                      setFrameIndex(parseInt(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                    <span>T-3h 30m</span>
                    <span>T-2h</span>
                    <span>T-1h</span>
                    <span className="text-cyan-400 font-bold">LATEST (T-0)</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right: Band Radiometric Diagnostics & Meteorological Context */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard className="p-5 border-l-4 border-l-cyan-500">
              <h3 className="text-base font-black text-white mb-2">📡 Radiometric Band Details</h3>
              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-gray-400 block">Spectral Channel:</span>
                  <span className="font-bold text-white">{currentBandInfo.name}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-gray-400 block">Spacecraft Payload:</span>
                  <span className="font-bold text-cyan-300">{currentBandInfo.satellite}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-gray-400 block">Center Wavelength:</span>
                  <span className="font-bold text-amber-300 font-mono">{currentBandInfo.wavelength}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-gray-400 block mb-1">Meteorological Application:</span>
                  <p className="text-gray-300 leading-relaxed">{currentBandInfo.description}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h4 className="font-bold text-white text-sm mb-3">🛰️ Ground Station Sync Status</h4>
              <div className="space-y-2 text-xs">
                {[
                  { name: "ISRO SAC Ahmedabad Earth Station", status: "ONLINE", latency: "140ms" },
                  { name: "IMD Mausam Bhavan Gateway", status: "ONLINE", latency: "85ms" },
                  { name: "INSAT-3DR Geostationary Relink", status: "NOMINAL", latency: "240ms" },
                  { name: "Radar Mosaicing Engine (DWR-39)", status: "ONLINE", latency: "95ms" },
                ].map((st, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-gray-300">{st.name}</span>
                    <span className="text-green-400 font-mono font-bold text-[10px] bg-green-500/10 px-2 py-0.5 rounded">
                      {st.status} ({st.latency})
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
