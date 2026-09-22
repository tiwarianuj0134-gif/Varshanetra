"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";

interface WarningText {
  districtName: string;
  stateName: string;
  warningLevel: string;
  expectedRainfallMm: number;
}

export default function OfflineLowBandwidthPage() {
  const [warnings, setWarnings] = useState<WarningText[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState("ALL");

  useEffect(() => {
    fetch("/api/warnings?limit=30")
      .then((r) => r.json())
      .then((d) => {
        setWarnings(d.warnings || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback static high-risk alerts for true offline simulation
        setWarnings([
          { districtName: "Mumbai", stateName: "Maharashtra", warningLevel: "RED", expectedRainfallMm: 240 },
          { districtName: "Thane", stateName: "Maharashtra", warningLevel: "RED", expectedRainfallMm: 220 },
          { districtName: "Wayanad", stateName: "Kerala", warningLevel: "RED", expectedRainfallMm: 260 },
          { districtName: "Kamrup Metro", stateName: "Assam", warningLevel: "ORANGE", expectedRainfallMm: 145 },
          { districtName: "Puri", stateName: "Odisha", warningLevel: "ORANGE", expectedRainfallMm: 130 },
        ]);
        setLoading(false);
      });
  }, []);

  const redList = warnings.filter((w) => w.warningLevel === "RED");
  const filtered = filterState === "ALL" ? warnings : warnings.filter((w) => w.stateName === filterState);

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono text-sm">
      {/* Top Banner */}
      <div className="border-b-2 border-yellow-400 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-yellow-400 font-black text-base">
            🌧️ VARSHANETRA — LOW-BANDWIDTH DISASTER MODE
          </span>
          <Link href="/" className="text-cyan-400 underline text-xs">
            Switch to Full WebApp →
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Optimized for 2G / 3G networks and emergency low-battery situations (&lt; 20KB total payload).
        </p>
      </div>

      {/* Critical Alerts Banner */}
      {redList.length > 0 && (
        <div className="border-2 border-red-500 bg-red-950/40 p-3 mb-4 text-red-300">
          <p className="font-black text-red-400 text-base mb-1">
            ⚠️ CRITICAL RED ALERTS ACTIVE ({redList.length} DISTRICTS):
          </p>
          <p className="text-xs leading-relaxed">
            {redList.map((w) => `${w.districtName} (${Math.round(w.expectedRainfallMm)}mm)`).join(" | ")}
          </p>
        </div>
      )}

      {/* Emergency Phone Helplines */}
      <div className="border border-white/30 p-3 mb-4">
        <p className="font-bold text-yellow-300 mb-2">📞 24x7 EMERGENCY PHONE HELPLINES (TAP TO CALL):</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <a href="tel:112" className="p-2 border border-white/20 text-center hover:bg-white/10">
            🚨 Police / All: <strong>112</strong>
          </a>
          <a href="tel:1077" className="p-2 border border-white/20 text-center hover:bg-white/10">
            🌊 Disaster Control: <strong>1077</strong>
          </a>
          <a href="tel:108" className="p-2 border border-white/20 text-center hover:bg-white/10">
            🚑 Ambulance: <strong>108</strong>
          </a>
          <a href="tel:1070" className="p-2 border border-white/20 text-center hover:bg-white/10">
            🏛️ State Relief: <strong>1070</strong>
          </a>
        </div>
      </div>

      {/* SMS Fallback Query Guide */}
      <div className="border border-cyan-500/40 p-3 mb-4 bg-cyan-950/20 text-cyan-200 text-xs space-y-1">
        <p className="font-bold text-cyan-300">📱 NO INTERNET? USE SMS EMERGENCY FORECAST SERVICE:</p>
        <p>Send SMS format: <strong className="text-white">RAIN &lt;DISTRICT&gt;</strong> to <strong className="text-white">56161</strong></p>
        <p className="text-gray-400">Example: Text "RAIN MUMBAI" to 56161 to receive an instant SMS forecast with warning level.</p>
      </div>

      {/* Warning Feed Table */}
      <div className="border border-white/20 p-3 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-white">📋 ACTIVE DISTRICT WARNINGS:</span>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="bg-black border border-white/40 text-xs px-2 py-1 text-white"
          >
            <option value="ALL">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Kerala">Kerala</option>
            <option value="Assam">Assam</option>
            <option value="Karnataka">Karnataka</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading warnings...</p>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/30 text-gray-400">
                <th className="py-1">Level</th>
                <th className="py-1">District</th>
                <th className="py-1">State</th>
                <th className="py-1">Rain (24h)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, idx) => (
                <tr key={idx} className="border-b border-white/10">
                  <td className="py-1.5 font-bold">
                    <span
                      style={{
                        color:
                          w.warningLevel === "RED"
                            ? "#ff4444"
                            : w.warningLevel === "ORANGE"
                            ? "#ffaa00"
                            : "#ffff00",
                      }}
                    >
                      [{w.warningLevel}]
                    </span>
                  </td>
                  <td className="py-1.5 font-bold text-white">{w.districtName}</td>
                  <td className="py-1.5 text-gray-400">{w.stateName}</td>
                  <td className="py-1.5 font-bold">{Math.round(w.expectedRainfallMm)} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Plain-text Life Safety Rules */}
      <div className="border border-white/20 p-3 text-xs text-gray-300 space-y-1">
        <p className="font-bold text-white mb-1">🛡️ FLOOD SAFETY DO'S AND DON'TS:</p>
        <p>1. Do not walk or drive through flowing water; 6 inches of moving water can knock you down.</p>
        <p>2. Keep mobile phones charged and switch off main electric supply if water enters your house.</p>
        <p>3. Move to designated high ground or community relief shelters immediately if water rises.</p>
        <p>4. Boil drinking water before consumption to prevent waterborne infections.</p>
      </div>

      <div className="text-center text-gray-600 text-xs mt-6">
        VARSHANETRA v1.0 | MoES / IMD Smart India Hackathon 2026
      </div>
    </div>
  );
}
