"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { formatNumber } from "@/lib/utils";

interface Shelter {
  id: string;
  name: string;
  district: string;
  elevationM: number;
  capacity: number;
  occupied: number;
  foodStockDays: number;
  hasMedical: boolean;
  contact: string;
  distanceKm: number;
  routeStatus: "SAFE" | "CAUTION" | "BLOCKED";
}

const SHELTERS_DATA: Record<string, Shelter[]> = {
  "MH-MUM": [
    { id: "SH-01", name: "Bandra Kurla Complex Sports Arena (High Ground)", district: "Mumbai", elevationM: 28, capacity: 4500, occupied: 1820, foodStockDays: 10, hasMedical: true, contact: "+91 22 2659 0001", distanceKm: 3.2, routeStatus: "SAFE" },
    { id: "SH-02", name: "IIT Bombay Powai Community Hall", district: "Mumbai", elevationM: 42, capacity: 3000, occupied: 950, foodStockDays: 14, hasMedical: true, contact: "+91 22 2576 7000", distanceKm: 7.8, routeStatus: "SAFE" },
    { id: "SH-03", name: "Dadar Shivaji Park Municipal Relief Camp", district: "Mumbai", elevationM: 14, capacity: 2500, occupied: 2100, foodStockDays: 5, hasMedical: true, contact: "+91 22 2430 1122", distanceKm: 4.1, routeStatus: "CAUTION" },
    { id: "SH-04", name: "Andheri Sports Complex Indoor Stadium", district: "Mumbai", elevationM: 19, capacity: 3500, occupied: 2800, foodStockDays: 6, hasMedical: false, contact: "+91 22 2673 0300", distanceKm: 5.4, routeStatus: "CAUTION" },
    { id: "SH-05", name: "Kurla West Municipal School (Near Mithi River)", district: "Mumbai", elevationM: 8, capacity: 1200, occupied: 1150, foodStockDays: 2, hasMedical: false, contact: "+91 22 2503 1400", distanceKm: 2.1, routeStatus: "BLOCKED" },
  ],
  "KL-WYN": [
    { id: "SH-10", name: "Meppadi Higher Secondary School Camp", district: "Wayanad", elevationM: 820, capacity: 1500, occupied: 650, foodStockDays: 12, hasMedical: true, contact: "+91 4936 282 221", distanceKm: 4.5, routeStatus: "SAFE" },
    { id: "SH-11", name: "Kalpetta Town Relief Shelter", district: "Wayanad", elevationM: 780, capacity: 2200, occupied: 1100, foodStockDays: 9, hasMedical: true, contact: "+91 4936 202 300", distanceKm: 8.2, routeStatus: "SAFE" },
    { id: "SH-12", name: "Chooralmala Tea Estate Guesthouse", district: "Wayanad", elevationM: 740, capacity: 800, occupied: 780, foodStockDays: 3, hasMedical: false, contact: "+91 4936 288 400", distanceKm: 3.1, routeStatus: "BLOCKED" },
  ],
};

function EvacuationContent() {
  const searchParams = useSearchParams();
  const initialDistrict = searchParams.get("district") || "MH-MUM";
  const [districtCode, setDistrictCode] = useState(initialDistrict);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  const currentDistrict = INDIAN_DISTRICTS.find(d => d.code === districtCode) || INDIAN_DISTRICTS[0];
  const shelters = SHELTERS_DATA[districtCode] || SHELTERS_DATA["MH-MUM"].map(s => ({
    ...s,
    name: `${currentDistrict.name} Central Relief Shelter ${s.id.slice(-2)}`,
    district: currentDistrict.name,
  }));

  useEffect(() => {
    setSelectedShelter(shelters[0]);
  }, [districtCode]);

  return (
    <div className="min-h-screen overflow-x-hidden text-gray-200 flex flex-col bg-transparent">
      <Navbar />

      <main className="mt-16 flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-[#0A1628] to-cyan-950/40 p-6 rounded-2xl border border-red-500/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600/30 text-red-400 border border-red-500/40 uppercase">
                LIFE SAFETY PROTOCOL
              </span>
              <span className="text-xs text-green-400 font-bold">● LIVE SHELTER TELEMETRY</span>
            </div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              🏃 Evacuation & Safe Flood Relief Shelter Route Planner
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              High-ground designated shelters, live capacity monitoring, and safe road corridors avoiding inundated zones
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold text-gray-300 whitespace-nowrap">District:</label>
            <select
              value={districtCode}
              onChange={(e) => setDistrictCode(e.target.value)}
              className="bg-white/10 border border-cyan-500/40 rounded-xl px-4 py-2 text-white font-bold text-sm focus:outline-none focus:border-cyan-400 w-full md:w-64"
            >
              {INDIAN_DISTRICTS.map((d) => (
                <option key={d.code} value={d.code} className="bg-[#0A1628]">
                  {d.name} ({d.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2-Column Evacuation Map & Shelter Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Evacuation Corridor Map Canvas */}
          <div className="lg:col-span-7 space-y-4">
            <GlassCard className="p-4 border-cyan-500/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <span>🗺️</span> Real-time Evacuation Corridor Map ({currentDistrict.name})
                </h3>
                <span className="text-xs text-cyan-400 font-mono">GPS: {currentDistrict.lat.toFixed(4)}°N, {currentDistrict.lon.toFixed(4)}°E</span>
              </div>

              {/* Graphical Route Matrix Canvas */}
              <div className="relative h-96 w-full rounded-xl bg-[#071322] border border-white/10 overflow-hidden p-4">
                {/* SVG Visual Map overlay with nodes and corridors */}
                <svg className="w-full h-full" viewBox="0 0 500 350">
                  {/* Grid background lines */}
                  <defs>
                    <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* River Flow Path (Water Hazard) */}
                  <path
                    d="M 50 350 Q 180 220 220 180 T 450 0"
                    fill="none"
                    stroke="#00D4FF"
                    strokeWidth="28"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M 50 350 Q 180 220 220 180 T 450 0"
                    fill="none"
                    stroke="#0088CC"
                    strokeWidth="10"
                    strokeDasharray="6 4"
                    strokeOpacity="0.7"
                  />
                  <text x="260" y="140" fill="#00D4FF" fontSize="10" fontWeight="bold" opacity="0.8">
                    🌊 RIVER BASIN (INUNDATED)
                  </text>

                  {/* Blocked corridor (Red X) */}
                  <line x1="180" y1="260" x2="220" y2="180" stroke="#FF4444" strokeWidth="4" strokeDasharray="5 5" />
                  <circle cx="200" cy="220" r="10" fill="#FF2222" opacity="0.8" />
                  <text x="215" y="225" fill="#FF4444" fontSize="10" fontWeight="bold">⛔ SUBMERGED ROAD</text>

                  {/* Safe Highway Corridor (Green) */}
                  <path
                    d="M 120 290 Q 90 160 180 90 T 360 60"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="5"
                    strokeDasharray="8 4"
                  />
                  <text x="70" y="140" fill="#10B981" fontSize="10" fontWeight="bold">
                    ✅ SAFE HIGHWAY (HIGH GROUND)
                  </text>

                  {/* User Current Position */}
                  <g transform="translate(140, 280)">
                    <circle r="14" fill="#3B82F6" opacity="0.3" className="animate-ping" />
                    <circle r="8" fill="#3B82F6" stroke="#fff" strokeWidth="2" />
                    <text x="12" y="4" fill="#60A5FA" fontSize="11" fontWeight="black">📍 YOUR LOCATION</text>
                  </g>

                  {/* Shelter Nodes */}
                  {shelters.map((s, idx) => {
                    const coords = [
                      { x: 380, y: 70 },
                      { x: 320, y: 160 },
                      { x: 260, y: 270 },
                      { x: 160, y: 90 },
                      { x: 210, y: 190 },
                    ][idx] || { x: 300, y: 200 };

                    const isSel = selectedShelter?.id === s.id;

                    return (
                      <g
                        key={s.id}
                        transform={`translate(${coords.x}, ${coords.y})`}
                        onClick={() => setSelectedShelter(s)}
                        className="cursor-pointer group"
                      >
                        <circle
                          r={isSel ? 18 : 12}
                          fill={s.routeStatus === "SAFE" ? "#059669" : s.routeStatus === "CAUTION" ? "#D97706" : "#DC2626"}
                          stroke="#fff"
                          strokeWidth={isSel ? 3 : 1.5}
                          opacity={isSel ? 1 : 0.85}
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          🏕️
                        </text>
                        <text
                          x="16"
                          y="4"
                          fill={isSel ? "#38BDF8" : "#E2E8F0"}
                          fontSize="10"
                          fontWeight={isSel ? "bold" : "normal"}
                        >
                          {s.name.split(" ")[0]} ({s.elevationM}m)
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Map Floating Legend */}
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-[10px] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-gray-300">Safe Evacuation Route (High Ground)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-gray-300">Caution Route (Minor Waterlogging)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-gray-300">Submerged Road (Do Not Enter)</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Selected Shelter Details Card */}
            {selectedShelter && (
              <GlassCard className="p-5 border-cyan-500/40 bg-cyan-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      SELECTED SHELTER
                    </span>
                    <h4 className="text-lg font-black text-white mt-1">{selectedShelter.name}</h4>
                    <p className="text-xs text-gray-400">
                      Distance: <strong className="text-cyan-400">{selectedShelter.distanceKm} km</strong> · Safe Ground Elevation:{" "}
                      <strong className="text-green-400">+{selectedShelter.elevationM}m</strong>
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase text-center ${
                      selectedShelter.routeStatus === "SAFE"
                        ? "bg-green-600/30 text-green-300 border border-green-500/50"
                        : selectedShelter.routeStatus === "CAUTION"
                        ? "bg-yellow-600/30 text-yellow-300 border border-yellow-500/50"
                        : "bg-red-600/30 text-red-300 border border-red-500/50"
                    }`}
                  >
                    ROUTE: {selectedShelter.routeStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-4">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-gray-400 block">Occupancy</span>
                    <span className="text-base font-black text-white">
                      {formatNumber(selectedShelter.occupied)} / {formatNumber(selectedShelter.capacity)}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-gray-400 block">Food Rations</span>
                    <span className="text-base font-black text-green-400">{selectedShelter.foodStockDays} Days</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-gray-400 block">Medical Officer</span>
                    <span className="text-base font-black text-cyan-400">{selectedShelter.hasMedical ? "Available" : "On Call"}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-gray-400 block">Helpline</span>
                    <span className="text-xs font-bold text-white font-mono mt-1 block">{selectedShelter.contact}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`tel:${selectedShelter.contact}`}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-xs text-center transition-all shadow-lg shadow-green-600/20"
                  >
                    📞 Call Camp Incharge
                  </a>
                  <button
                    onClick={() => alert(`Navigating to ${selectedShelter.name} via ${selectedShelter.routeStatus === "SAFE" ? "Northern High Bypass" : "Eastern Corridor"}. Keep your phone battery charged and follow police diversions.`)}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs text-center transition-all shadow-lg shadow-cyan-500/20"
                  >
                    🧭 Start Turn-by-Turn Safe Directions
                  </button>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right: Shelter Directory List */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-5">
              <h3 className="text-base font-black text-white mb-3 flex items-center justify-between">
                <span>🏕️ Designated Flood Shelters ({shelters.length})</span>
                <span className="text-xs text-gray-400">Sorted by proximity</span>
              </h3>

              <div className="space-y-3">
                {shelters.map((s) => {
                  const pct = Math.round((s.occupied / s.capacity) * 100);
                  const isSel = selectedShelter?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShelter(s)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSel
                          ? "bg-cyan-500/15 border-cyan-500/60 shadow-lg shadow-cyan-500/10"
                          : "bg-white/5 hover:bg-white/8 border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-white">{s.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {s.distanceKm} km away · Elevation: <strong className="text-green-400">+{s.elevationM}m</strong>
                          </p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                            s.routeStatus === "SAFE"
                              ? "bg-green-500/20 text-green-400 border border-green-500/40"
                              : s.routeStatus === "CAUTION"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                              : "bg-red-500/20 text-red-400 border border-red-500/40"
                          }`}
                        >
                          {s.routeStatus}
                        </span>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                          <span>Capacity Utilized</span>
                          <span className={pct > 80 ? "text-red-400 font-bold" : "text-white"}>{pct}% ({formatNumber(s.occupied)}/{formatNumber(s.capacity)})</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-cyan-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2.5 pt-2 border-t border-white/5">
                        <span>🍞 {s.foodStockDays} days food stock</span>
                        <span>{s.hasMedical ? "🩺 Medical Doctor" : "🚑 Basic First Aid"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Emergency Evacuation Kit Advice */}
            <GlassCard className="p-5 border-l-4 border-l-amber-500">
              <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                <span>🎒</span> 72-Hour Flood Evacuation Kit Essentials
              </h4>
              <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>Aadhaar cards, land records & property papers sealed in waterproof ziplock bags</li>
                <li>3-day dry food (flattened rice / chivda, biscuits) and 3 liters drinking water per person</li>
                <li>Essential prescription medicines, ORS sachets, and antiseptic wipes</li>
                <li>Fully charged mobile phones, power banks, and battery-powered emergency torches</li>
                <li>Whistle for signaling rescue boats and high-visibility clothing</li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EvacuationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen overflow-x-hidden bg-transparent flex items-center justify-center text-sky-600 font-medium">Loading Evacuation Routes...</div>}>
      <EvacuationContent />
    </Suspense>
  );
}
