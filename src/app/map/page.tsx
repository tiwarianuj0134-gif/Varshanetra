"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { WarningBadge } from "@/components/ui/WarningBadge";
import { getWarningColor, formatNumber } from "@/lib/utils";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center"><div className="text-4xl mb-4 animate-bounce">🗺️</div>
        <p className="text-sky-600 font-bold">Loading Live Rainfall Map...</p>
        <p className="text-gray-500 text-sm mt-2">Fetching 4-source fused data</p></div>
    </div>
  ),
});

interface Warning { districtCode: string; districtName: string; stateName: string; warningLevel: string; expectedRainfallMm: number; populationAtRisk: number; }
interface RainfallPoint { districtCode: string; districtName: string; stateName: string; latitude: number; longitude: number; rainfallMm: number; warningLevel: string; }

const LAYERS = [
  { id: "rainfall", label: "🌧️ Rainfall Heatmap" }, { id: "radar", label: "📡 Radar Composite" },
  { id: "satellite", label: "🛰️ Satellite IR" }, { id: "inundation", label: "🌊 Inundation Risk" },
  { id: "warnings", label: "⚠️ Warning Zones" }, { id: "stations", label: "📍 Weather Stations" },
  { id: "rivers", label: "🏞️ River Network" }, { id: "terrain", label: "🏔️ Terrain/DEM" },
];

function MapContent() {
  const params = useSearchParams();
  const [rainfallData, setRainfallData] = useState<RainfallPoint[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<RainfallPoint | null>(null);
  const [activeSource, setActiveSource] = useState("fused");
  const [activeLayers, setActiveLayers] = useState(["rainfall", "warnings", "stations"]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [rfRes, warnRes] = await Promise.all([
        fetch(`/api/rainfall/current?source=${activeSource}`),
        fetch("/api/warnings"),
      ]);
      if (rfRes.ok) { const d = await rfRes.json(); setRainfallData(d.data || []); setLastUpdate(new Date()); }
      if (warnRes.ok) { const d = await warnRes.json(); setWarnings(d.warnings || []); }
    } catch { }
    setLoading(false);
  }, [activeSource]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, [fetchData]);

  const redCount = warnings.filter(w => w.warningLevel === "RED").length;
  const orangeCount = warnings.filter(w => w.warningLevel === "ORANGE").length;
  const yellowCount = warnings.filter(w => w.warningLevel === "YELLOW").length;

  const filteredWarnings = warnings.filter(w =>
    (!stateFilter || w.stateName === stateFilter) &&
    (!searchQuery || w.districtName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const uniqueStates = [...new Set(warnings.map(w => w.stateName))].sort();

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-[9999]" : "h-screen"} flex flex-col bg-[var(--bg-primary)] overflow-hidden`}>
      {!isFullscreen && <Navbar />}
      <div className={`${isFullscreen ? "" : "mt-16"} flex flex-1 overflow-hidden`}>

        {/* Left Panel */}
        {!isFullscreen && (
          <aside className="w-64 bg-[#0A1628]/95 border-r border-white/8 overflow-y-auto z-10 flex-shrink-0 scrollbar-thin">
            <div className="p-3 space-y-3">
              <div>
                <h2 className="font-black text-base mb-1">🗺️ Live Rainfall Map</h2>
                <p className="text-xs text-gray-500">Updated: {lastUpdate.toLocaleTimeString("en-IN")}</p>
              </div>

              {/* Search */}
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search district..."
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none" />

              {/* State Filter */}
              <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
                <option value="" className="bg-[#0A1628]">All States</option>
                {uniqueStates.map(s => <option key={s} value={s} className="bg-[#0A1628]">{s}</option>)}
              </select>

              {/* Source Selector */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Data Source</p>
                {[
                  { id: "fused", label: "🔄 AI Fused (Best)", badge: "RECOMMENDED" },
                  { id: "satellite", label: "🛰️ INSAT-3D" },
                  { id: "radar", label: "📡 Doppler Radar" },
                  { id: "station", label: "🌡️ AWS Stations" },
                  { id: "nwp", label: "🖥️ NWP Model" },
                ].map(src => (
                  <button key={src.id} onClick={() => setActiveSource(src.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 transition-all ${activeSource === src.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "text-gray-400 hover:bg-white/5"}`}>
                    {src.label}
                    {src.badge && <span className="ml-1 text-xs bg-green-500/20 text-green-400 px-1 rounded">{src.badge}</span>}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Rainfall (mm/24h)</p>
                {[
                  { label: "Extremely Heavy", range: ">204mm", color: "#FF0000" },
                  { label: "Very Heavy", range: "115-204mm", color: "#FF6B00" },
                  { label: "Heavy", range: "64-115mm", color: "#FFB800" },
                  { label: "Moderate", range: "15-64mm", color: "#00D4FF" },
                  { label: "Light", range: "2-15mm", color: "#00FF88" },
                  { label: "Trace", range: "<2mm", color: "#444" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-300">{item.label} <span className="text-gray-600">({item.range})</span></span>
                  </div>
                ))}
              </div>

              {/* Warning Summary */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Warning Summary</p>
                <div className="space-y-1.5">
                  {redCount > 0 && <div className="flex items-center justify-between bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-2 animate-pulse"><span className="text-red-400 text-xs font-bold">🔴 RED</span><span className="text-red-400 font-black">{redCount}</span></div>}
                  <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2"><span className="text-orange-400 text-xs font-bold">🟠 ORANGE</span><span className="text-orange-400 font-black">{orangeCount}</span></div>
                  <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2"><span className="text-yellow-400 text-xs font-bold">🟡 YELLOW</span><span className="text-yellow-400 font-black">{yellowCount}</span></div>
                </div>
              </div>

              {/* Filtered warning list */}
              {(searchQuery || stateFilter) && filteredWarnings.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Results ({filteredWarnings.length})</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                    {filteredWarnings.map(w => (
                      <div key={w.districtCode} className="flex items-center gap-2 p-2 bg-white/4 rounded-lg border border-white/8">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getWarningColor(w.warningLevel) }} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{w.districtName}</p>
                          <p className="text-xs text-gray-500">{w.stateName} · {Math.round(w.expectedRainfallMm)}mm</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPoint && (
                <GlassCard className="p-3">
                  <h3 className="font-bold text-sm mb-2">{selectedPoint.districtName}</h3>
                  <p className="text-xs text-gray-400 mb-2">{selectedPoint.stateName}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Rainfall</span><span className="font-bold text-cyan-400">{Math.round(selectedPoint.rainfallMm)}mm</span></div>
                    <WarningBadge level={selectedPoint.warningLevel} size="sm" />
                  </div>
                </GlassCard>
              )}
            </div>
          </aside>
        )}

        {/* Map area */}
        <main className="flex-1 relative">
          {/* Floating toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
            <div className="map-overlay-card px-3 py-2 flex items-center gap-2">
              <button onClick={() => setShowLayerPanel(!showLayerPanel)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showLayerPanel ? "bg-cyan-500/30 text-cyan-400" : "text-gray-300 hover:bg-white/10"}`}>
                🗂️ Layers
              </button>
              <div className="w-px h-4 bg-white/10" />
              <button className="px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-all">📤 Export</button>
              <button className="px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-all">🔗 Share</button>
              <button onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-all">
                {isFullscreen ? "↙️ Exit" : "⛶ Full"}
              </button>
            </div>
          </div>

          {/* Layer panel popup */}
          {showLayerPanel && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] map-overlay-card p-4 min-w-64">
              <h3 className="font-bold text-sm mb-3">🗂️ Map Layers</h3>
              <div className="grid grid-cols-2 gap-2">
                {LAYERS.map(layer => (
                  <label key={layer.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-all">
                    <input type="checkbox" checked={activeLayers.includes(layer.id)}
                      onChange={() => setActiveLayers(prev => prev.includes(layer.id) ? prev.filter(l => l !== layer.id) : [...prev, layer.id])}
                      className="accent-cyan-500" />
                    <span className={`text-xs ${activeLayers.includes(layer.id) ? "text-white" : "text-gray-500"}`}>{layer.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center"><div className="text-6xl mb-4 animate-bounce">🌧️</div><p className="text-cyan-400 font-bold text-xl">Loading rainfall data...</p></div>
            </div>
          ) : (
            <MapView rainfallData={rainfallData} warnings={warnings} onPointSelect={setSelectedPoint} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[var(--bg-primary)] flex items-center justify-center"><p className="text-sky-600 font-medium">Loading Map...</p></div>}>
      <MapContent />
    </Suspense>
  );
}
