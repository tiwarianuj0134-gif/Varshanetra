"use client";
import { useEffect, useRef, useState } from "react";
import { getWarningColor, getRainfallCategoryColor } from "@/lib/utils";

interface RainfallPoint {
  districtCode: string;
  districtName: string;
  stateName: string;
  latitude: number;
  longitude: number;
  rainfallMm: number;
  warningLevel: string;
}

interface Warning {
  districtCode: string;
  districtName: string;
  stateName: string;
  warningLevel: string;
  expectedRainfallMm: number;
  populationAtRisk: number;
}

interface MapViewProps {
  rainfallData: RainfallPoint[];
  warnings: Warning[];
  onPointSelect?: (point: RainfallPoint) => void;
}

export default function MapView({ rainfallData, warnings, onPointSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || leafletMapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const map = L.map(mapRef.current!, {
        center: [22.5, 79.0],
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "©OpenStreetMap contributors ©CARTO",
          maxZoom: 18,
        }
      ).addTo(map);

      leafletMapRef.current = map;

      return map;
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        (leafletMapRef.current as { remove: () => void }).remove();
        leafletMapRef.current = null;
      }
    };
  }, [mounted]);

  useEffect(() => {
    if (!leafletMapRef.current || !rainfallData.length) return;

    const updateMarkers = async () => {
      const L = (await import("leaflet")).default;
      const map = leafletMapRef.current as { addLayer: (l: unknown) => void; removeLayer: (l: unknown) => void };

      // Clear old markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      rainfallData.forEach((point) => {
        if (!point.latitude || !point.longitude) return;

        const color = point.rainfallMm >= 204.5 ? "#FF0000" :
          point.rainfallMm >= 115.6 ? "#FF6B00" :
          point.rainfallMm >= 64.5 ? "#FFB800" :
          point.rainfallMm >= 15.6 ? "#00D4FF" :
          point.rainfallMm >= 2.5 ? "#00FF88" : "#444";

        const warningColor = getWarningColor(point.warningLevel);
        const size = point.rainfallMm >= 200 ? 28 : point.rainfallMm >= 100 ? 22 : point.rainfallMm >= 50 ? 18 : 14;

        const icon = L.divIcon({
          html: `
            <div style="
              width: ${size}px; height: ${size}px;
              background: ${color};
              border: 2px solid ${point.warningLevel !== "GREEN" ? warningColor : color};
              border-radius: 50%;
              opacity: 0.85;
              box-shadow: 0 0 ${point.rainfallMm >= 100 ? "15px" : "6px"} ${color}80;
              ${point.warningLevel === "RED" ? "animation: pulse 1.5s infinite;" : ""}
            "></div>
            ${point.rainfallMm >= 100 ? `
              <div style="
                width: ${size + 10}px; height: ${size + 10}px;
                background: ${color}30;
                border-radius: 50%;
                position: absolute;
                top: -5px; left: -5px;
                animation: ping 2s infinite;
              "></div>
            ` : ""}
          `,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([point.latitude, point.longitude], { icon });
        marker.bindPopup(`
          <div style="
            background: #0A1628;
            color: #F0F4FF;
            border-radius: 8px;
            padding: 12px;
            min-width: 200px;
            border: 1px solid rgba(0,212,255,0.3);
            font-family: sans-serif;
          ">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <strong style="font-size:14px;">${point.districtName}</strong>
              <span style="
                background: ${warningColor}30;
                color: ${warningColor};
                border: 1px solid ${warningColor}60;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
              ">${point.warningLevel}</span>
            </div>
            <p style="color:#94A3B8;font-size:12px;margin-bottom:8px;">${point.stateName}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div style="background:rgba(255,255,255,0.05);padding:6px;border-radius:6px;text-align:center;">
                <div style="font-size:18px;font-weight:900;color:${color};">${Math.round(point.rainfallMm)}</div>
                <div style="font-size:10px;color:#666;">mm/24h</div>
              </div>
              <div style="background:rgba(255,255,255,0.05);padding:6px;border-radius:6px;text-align:center;">
                <div style="font-size:18px;font-weight:900;color:#A855F7;">${point.rainfallMm >= 204.5 ? "Extreme" : point.rainfallMm >= 115.6 ? "V.Heavy" : point.rainfallMm >= 64.5 ? "Heavy" : "Moderate"}</div>
                <div style="font-size:10px;color:#666;">Category</div>
              </div>
            </div>
          </div>
        `, { maxWidth: 280 });

        marker.on("click", () => {
          if (onPointSelect) onPointSelect(point);
        });

        map.addLayer(marker);
        markersRef.current.push(marker);
      });
    };

    updateMarkers();
  }, [rainfallData, onPointSelect]);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-[#060E1A]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌧️</div>
          <p className="text-cyan-400 font-bold">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Overlay: Stats */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <div className="glass-card p-3 min-w-40">
          <p className="text-xs text-gray-400 mb-2 font-semibold">⚡ Live Statistics</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Points</span>
              <span className="text-cyan-400 font-bold">{rainfallData.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Warnings</span>
              <span className="text-orange-400 font-bold">{warnings.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Red Zones</span>
              <span className="text-red-400 font-bold">{warnings.filter((w) => w.warningLevel === "RED").length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay: Color scale */}
      <div className="absolute bottom-8 left-4 z-[1000]">
        <div className="glass-card p-3">
          <p className="text-xs text-gray-400 font-semibold mb-2">Rainfall Intensity</p>
          <div className="flex items-center gap-1">
            {["#444", "#00FF88", "#00D4FF", "#FFB800", "#FF6B00", "#FF0000"].map((c, i) => (
              <div key={i} className="w-5 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Low</span>
            <span>Extreme</span>
          </div>
        </div>
      </div>

      {/* Rain particle animation overlay for heavy rain zones */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
