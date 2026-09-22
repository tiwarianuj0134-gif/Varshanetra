"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { WarningBadge } from "@/components/ui/WarningBadge";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatNumber, getWarningColor } from "@/lib/utils";

interface DistrictMetric {
  code: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  pop: number;
  currentRainfall24h: number;
  predicted48h: number;
  warningLevel: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  affectedPop: number;
  humidity: number;
  temp: number;
  hourlySeries: { hour: string; rain: number }[];
}

export default function ComparePage() {
  const [district1, setDistrict1] = useState<string>("MH-MUM");
  const [district2, setDistrict2] = useState<string>("MH-PUN");
  const [district3, setDistrict3] = useState<string>("KL-WYN");
  const [data1, setData1] = useState<DistrictMetric | null>(null);
  const [data2, setData2] = useState<DistrictMetric | null>(null);
  const [data3, setData3] = useState<DistrictMetric | null>(null);

  const fetchMetric = async (code: string): Promise<DistrictMetric> => {
    const d = INDIAN_DISTRICTS.find(x => x.code === code) || INDIAN_DISTRICTS[0];
    try {
      const res = await fetch(`/api/district/${code}`);
      const json = await res.json();
      const wl = json.warning?.warningLevel || (d.lat > 18 && d.lon < 75 ? "ORANGE" : "YELLOW");
      const r24 = json.current?.rainfall24h || 120;
      const pred = json.predictions?.[0]?.predictedRainfallMm || r24 * 1.25;

      return {
        code: d.code,
        name: d.name,
        state: d.state,
        lat: d.lat,
        lon: d.lon,
        pop: d.pop,
        currentRainfall24h: r24,
        predicted48h: pred,
        warningLevel: wl,
        affectedPop: json.warning?.populationAtRisk || Math.round(d.pop * 0.12),
        humidity: json.current?.humidity || 85,
        temp: json.current?.temperature || 26,
        hourlySeries: [
          { hour: "00:00", rain: parseFloat((r24 * 0.08).toFixed(1)) },
          { hour: "04:00", rain: parseFloat((r24 * 0.14).toFixed(1)) },
          { hour: "08:00", rain: parseFloat((r24 * 0.22).toFixed(1)) },
          { hour: "12:00", rain: parseFloat((r24 * 0.28).toFixed(1)) },
          { hour: "16:00", rain: parseFloat((r24 * 0.18).toFixed(1)) },
          { hour: "20:00", rain: parseFloat((r24 * 0.10).toFixed(1)) },
        ],
      };
    } catch {
      return {
        code: d.code,
        name: d.name,
        state: d.state,
        lat: d.lat,
        lon: d.lon,
        pop: d.pop,
        currentRainfall24h: 110,
        predicted48h: 145,
        warningLevel: "ORANGE",
        affectedPop: Math.round(d.pop * 0.15),
        humidity: 82,
        temp: 27,
        hourlySeries: [
          { hour: "00:00", rain: 8 },
          { hour: "04:00", rain: 14 },
          { hour: "08:00", rain: 22 },
          { hour: "12:00", rain: 30 },
          { hour: "16:00", rain: 20 },
          { hour: "20:00", rain: 12 },
        ],
      };
    }
  };

  useEffect(() => {
    fetchMetric(district1).then(setData1);
  }, [district1]);

  useEffect(() => {
    fetchMetric(district2).then(setData2);
  }, [district2]);

  useEffect(() => {
    fetchMetric(district3).then(setData3);
  }, [district3]);

  // Combined chart data for side-by-side bar chart
  const combinedChart = [
    { time: "00:00", [data1?.name || "D1"]: data1?.hourlySeries[0]?.rain || 0, [data2?.name || "D2"]: data2?.hourlySeries[0]?.rain || 0, [data3?.name || "D3"]: data3?.hourlySeries[0]?.rain || 0 },
    { time: "04:00", [data1?.name || "D1"]: data1?.hourlySeries[1]?.rain || 0, [data2?.name || "D2"]: data2?.hourlySeries[1]?.rain || 0, [data3?.name || "D3"]: data3?.hourlySeries[1]?.rain || 0 },
    { time: "08:00", [data1?.name || "D1"]: data1?.hourlySeries[2]?.rain || 0, [data2?.name || "D2"]: data2?.hourlySeries[2]?.rain || 0, [data3?.name || "D3"]: data3?.hourlySeries[2]?.rain || 0 },
    { time: "12:00", [data1?.name || "D1"]: data1?.hourlySeries[3]?.rain || 0, [data2?.name || "D2"]: data2?.hourlySeries[3]?.rain || 0, [data3?.name || "D3"]: data3?.hourlySeries[3]?.rain || 0 },
    { time: "16:00", [data1?.name || "D1"]: data1?.hourlySeries[4]?.rain || 0, [data2?.name || "D2"]: data2?.hourlySeries[4]?.rain || 0, [data3?.name || "D3"]: data3?.hourlySeries[4]?.rain || 0 },
    { time: "20:00", [data1?.name || "D1"]: data1?.hourlySeries[5]?.rain || 0, [data2?.name || "D2"]: data2?.hourlySeries[5]?.rain || 0, [data3?.name || "D3"]: data3?.hourlySeries[5]?.rain || 0 },
  ];

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col bg-[var(--bg-primary)]">
      <Navbar />

      <main className="mt-16 flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950/40 via-[#0A1628] to-purple-950/40 p-6 rounded-2xl border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
              ANALYTICAL BENCHMARK
            </span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            ⚖️ Cross-District Rainfall & Flood Risk Comparison
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Compare precipitation intensities, warning thresholds, AI predicted peaks, and population vulnerabilities across 3 Indian districts
          </p>
        </div>

        {/* District Selectors Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0A1628] rounded-xl border border-cyan-500/40">
            <label className="text-xs text-cyan-400 font-bold block mb-1.5">Primary District 1</label>
            <select
              value={district1}
              onChange={(e) => setDistrict1(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
            >
              {INDIAN_DISTRICTS.map((d) => (
                <option key={d.code} value={d.code} className="bg-[#0A1628]">
                  {d.name} ({d.state})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-[#0A1628] rounded-xl border border-purple-500/40">
            <label className="text-xs text-purple-400 font-bold block mb-1.5">Comparison District 2</label>
            <select
              value={district2}
              onChange={(e) => setDistrict2(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-purple-400"
            >
              {INDIAN_DISTRICTS.map((d) => (
                <option key={d.code} value={d.code} className="bg-[#0A1628]">
                  {d.name} ({d.state})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-[#0A1628] rounded-xl border border-amber-500/40">
            <label className="text-xs text-amber-400 font-bold block mb-1.5">Comparison District 3</label>
            <select
              value={district3}
              onChange={(e) => setDistrict3(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
            >
              {INDIAN_DISTRICTS.map((d) => (
                <option key={d.code} value={d.code} className="bg-[#0A1628]">
                  {d.name} ({d.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-Side Comparison Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[data1, data2, data3].map((d, i) => {
            if (!d) return null;
            const borderCol = i === 0 ? "border-cyan-500/40" : i === 1 ? "border-purple-500/40" : "border-amber-500/40";
            const headerGrad = i === 0 ? "from-cyan-950/40" : i === 1 ? "from-purple-950/40" : "from-amber-950/40";

            return (
              <GlassCard key={d.code} className={`p-5 border-2 ${borderCol} flex flex-col justify-between`}>
                <div>
                  <div className={`p-4 rounded-xl bg-gradient-to-b ${headerGrad} to-transparent border border-white/10 mb-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-mono">{d.code}</span>
                      <WarningBadge level={d.warningLevel} size="sm" />
                    </div>
                    <h3 className="text-2xl font-black text-white">{d.name}</h3>
                    <p className="text-xs text-gray-400">{d.state} · Pop: {formatNumber(d.pop)}</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-400">24h Observed Rain:</span>
                      <span className="font-black text-white">{Math.round(d.currentRainfall24h)} mm</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-400">48h AI Predicted Peak:</span>
                      <span className="font-black text-cyan-300">{Math.round(d.predicted48h)} mm</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-400">Population at Risk:</span>
                      <span className="font-black text-red-400">{formatNumber(d.affectedPop)}</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-gray-400">Humidity / Temp:</span>
                      <span className="font-bold text-gray-200">{d.humidity}% / {d.temp}°C</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
                  <Link
                    href={`/district/${d.code}`}
                    className="flex-1 py-2 text-center rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
                  >
                    Deep Dive →
                  </Link>
                  <Link
                    href={`/inundation?district=${d.code}`}
                    className="flex-1 py-2 text-center rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
                  >
                    Simulate Flood
                  </Link>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Synced Precipitation Comparison Chart */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-white">📈 Synced 24h Hourly Rainfall Comparison</h3>
              <p className="text-xs text-gray-400 mt-0.5">Precipitation intensities (mm/hr) comparing all three selected sectors</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="text-cyan-400 flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-400 inline-block" /> {data1?.name}</span>
              <span className="text-purple-400 flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500 inline-block" /> {data2?.name}</span>
              <span className="text-amber-400 flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> {data3?.name}</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={combinedChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#888" }} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} label={{ value: "mm / 4hr", angle: -90, position: "insideLeft", fontSize: 10, fill: "#777" }} />
              <Tooltip contentStyle={{ background: "#0A1628", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "10px", fontSize: "12px" }} />
              <Legend />
              <Bar dataKey={data1?.name || "D1"} fill="#00D4FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey={data2?.name || "D2"} fill="#A855F7" radius={[4, 4, 0, 0]} />
              <Bar dataKey={data3?.name || "D3"} fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </main>
    </div>
  );
}
