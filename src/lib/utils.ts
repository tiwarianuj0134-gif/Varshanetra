import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, decimals = 0): string {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + " Cr";
  if (num >= 100000) return (num / 100000).toFixed(1) + " L";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(decimals);
}

export function getWarningColor(level: string): string {
  const colors: Record<string, string> = {
    RED: "#EF4444",
    ORANGE: "#F97316",
    YELLOW: "#EAB308",
    GREEN: "#22C55E",
  };
  return colors[level] || "#22C55E";
}

export function getWarningBg(level: string): string {
  const colors: Record<string, string> = {
    RED: "bg-red-500/20 border-red-500/50 text-red-400",
    ORANGE: "bg-orange-500/20 border-orange-500/50 text-orange-400",
    YELLOW: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
    GREEN: "bg-green-500/20 border-green-500/50 text-green-400",
  };
  return colors[level] || "bg-green-500/20 border-green-500/50 text-green-400";
}

export function getRainfallCategory(mm: number): string {
  if (mm >= 204.5) return "Extremely Heavy";
  if (mm >= 115.6) return "Very Heavy";
  if (mm >= 64.5) return "Heavy";
  if (mm >= 15.6) return "Moderate";
  if (mm >= 2.5) return "Light";
  return "Trace";
}

export function getRainfallCategoryColor(mm: number): string {
  if (mm >= 204.5) return "#FF0000";
  if (mm >= 115.6) return "#FF6B00";
  if (mm >= 64.5) return "#FFB800";
  if (mm >= 15.6) return "#00D4FF";
  if (mm >= 2.5) return "#00FF88";
  return "#666666";
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (now.getTime() - d.getTime()) / 1000;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function generateForecastTimeSeries(baseRainfall: number, hours = 72) {
  const data = [];
  let current = baseRainfall;
  const now = new Date();

  for (let h = -24; h <= hours; h++) {
    const time = new Date(now.getTime() + h * 3600000);
    const variation = (Math.random() - 0.4) * 20;
    const trend = h > 0 ? Math.sin((h / 24) * Math.PI) * 30 : 0;
    const value = Math.max(0, current + variation + trend);
    current = current * 0.95 + value * 0.05;

    data.push({
      time: time.toISOString(),
      label: h === 0 ? "NOW" : h < 0 ? `${-h}h ago` : `+${h}h`,
      observed: h <= 0 ? Math.max(0, value + Math.random() * 5) : null,
      predicted: h >= 0 ? Math.max(0, value) : null,
      upper: h >= 0 ? Math.max(0, value * (1 + 0.15 * (h / 24))) : null,
      lower: h >= 0 ? Math.max(0, value * (1 - 0.1 * (h / 24))) : null,
    });
  }
  return data;
}

export function generateWaterLevelTimeSeries(rainfallMm: number, durationH: number) {
  const data = [];
  for (let h = 0; h <= durationH; h++) {
    const riseRate = rainfallMm / 1000; // simplified
    const peakTime = durationH * 0.6;
    const factor = h < peakTime
      ? Math.pow(h / peakTime, 1.5)
      : Math.pow(1 - (h - peakTime) / (durationH - peakTime), 2);
    const depth = riseRate * factor * durationH * 0.3;
    data.push({
      hour: h,
      waterDepthM: Math.max(0, depth + (Math.random() - 0.5) * 0.05),
      dangerLevel: riseRate * durationH * 0.15,
    });
  }
  return data;
}
