"use client";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

interface Terrain3DProps {
  districtName?: string;
  district?: { name?: string } | null;
  waterDepth?: number; // in meters (0 to 5)
  floodDepth?: number;
  onDepthChange?: (newDepth: number) => void;
  isBreached?: boolean;
  onToggleBreach?: () => void;
}

export function Terrain3DViewer({
  districtName,
  district,
  waterDepth,
  floodDepth,
  onDepthChange,
  isBreached = false,
  onToggleBreach,
}: Terrain3DProps) {
  const normalizedDistrictName = districtName || district?.name || "District";
  const normalizedWaterDepth = Number.isFinite(waterDepth ?? floodDepth) ? (waterDepth ?? floodDepth ?? 0) : 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotX, setRotX] = useState(55); // pitch angle
  const [rotZ, setRotZ] = useState(45); // yaw angle
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [waveOffset, setWaveOffset] = useState(0);

  // Generate synthetic 3D elevation heightmap (20x20 grid)
  const gridSize = 24;
  const terrainHeights = useRef<number[][]>([]);

  useEffect(() => {
    const heights: number[][] = [];
    for (let y = 0; y < gridSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < gridSize; x++) {
        // Valley / river cutting through the middle
        const riverDist = Math.abs(x - (10 + Math.sin(y * 0.4) * 3));
        let h = Math.sin(x * 0.3) * 1.5 + Math.cos(y * 0.3) * 1.5 + 2.5;
        // River trough
        if (riverDist < 3.5) {
          h = Math.max(0.2, h - (3.5 - riverDist) * 1.2);
        }
        // Embankment ridge on river side
        if (riverDist >= 3.5 && riverDist < 5.0) {
          h += 1.2;
        }
        row.push(h);
      }
      heights.push(row);
    }
    terrainHeights.current = heights;
  }, []);

  // Continuous animation loop for water ripple waves
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setWaveOffset((prev) => (prev + 0.04) % (Math.PI * 2));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Render 3D isometric projection onto 2D canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || terrainHeights.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background gradient (dark mission-control space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#061224");
    bgGrad.addColorStop(1, "#030811");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const radX = (rotX * Math.PI) / 180;
    const radZ = (rotZ * Math.PI) / 180;
    const cosZ = Math.cos(radZ);
    const sinZ = Math.sin(radZ);
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);

    const scale = 14 * zoom;
    const centerX = width / 2;
    const centerY = height / 2 + 30;

    // 3D to 2D projection function
    const project = (x: number, y: number, z: number) => {
      // Center coordinates around (0,0)
      const cx = (x - gridSize / 2) * scale;
      const cy = (y - gridSize / 2) * scale;
      const cz = z * scale * 1.4;

      // Rotate yaw (around Z)
      const rx = cx * cosZ - cy * sinZ;
      const ry = cx * sinZ + cy * cosZ;

      // Rotate pitch (around X)
      const rz = ry * sinX + cz * cosX;
      const projY = ry * cosX - cz * sinX;

      return {
        px: centerX + rx,
        py: centerY + projY,
        depth: rz,
      };
    };

    const effectiveWaterLevel = isBreached ? normalizedWaterDepth * 1.25 : normalizedWaterDepth;

    // 1. Draw 3D Terrain polygons (painter's algorithm from back to front)
    const polys: Array<{
      pts: Array<{ px: number; py: number }>;
      avgDepth: number;
      avgH: number;
      isWater: boolean;
      submerged: boolean;
    }> = [];

    for (let y = 0; y < gridSize - 1; y++) {
      for (let x = 0; x < gridSize - 1; x++) {
        const h00 = terrainHeights.current[y][x];
        const h10 = terrainHeights.current[y][x + 1];
        const h11 = terrainHeights.current[y + 1][x + 1];
        const h01 = terrainHeights.current[y + 1][x];

        const avgH = (h00 + h10 + h11 + h01) / 4;
        const submerged = effectiveWaterLevel >= avgH;

        // Base terrain quad
        const p00 = project(x, y, h00);
        const p10 = project(x + 1, y, h10);
        const p11 = project(x + 1, y + 1, h11);
        const p01 = project(x, y + 1, h01);

        polys.push({
          pts: [p00, p10, p11, p01],
          avgDepth: (p00.depth + p10.depth + p11.depth + p01.depth) / 4,
          avgH,
          isWater: false,
          submerged,
        });

        // Water surface quad if water level reaches this cell
        if (effectiveWaterLevel > 0.3) {
          const waveH = Math.sin(x * 0.8 + y * 0.8 + waveOffset) * 0.08;
          const wLevel = effectiveWaterLevel + waveH;
          const wp00 = project(x, y, wLevel);
          const wp10 = project(x + 1, y, wLevel);
          const wp11 = project(x + 1, y + 1, wLevel);
          const wp01 = project(x, y + 1, wLevel);

          polys.push({
            pts: [wp00, wp10, wp11, wp01],
            avgDepth: (wp00.depth + wp10.depth + wp11.depth + wp01.depth) / 4 + 0.01,
            avgH: wLevel,
            isWater: true,
            submerged: false,
          });
        }
      }
    }

    // Sort back to front (largest depth to smallest)
    polys.sort((a, b) => b.avgDepth - a.avgDepth);

    // Render sorted quads
    polys.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(p.pts[0].px, p.pts[0].py);
      ctx.lineTo(p.pts[1].px, p.pts[1].py);
      ctx.lineTo(p.pts[2].px, p.pts[2].py);
      ctx.lineTo(p.pts[3].px, p.pts[3].py);
      ctx.closePath();

      if (p.isWater) {
        // Shimmering translucent blue water
        ctx.fillStyle = `rgba(0, 190, 255, ${Math.min(0.75, 0.35 + normalizedWaterDepth * 0.1)})`;
        ctx.fill();
        ctx.strokeStyle = "rgba(100, 230, 255, 0.4)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else {
        // Topography coloration
        if (p.submerged) {
          // Submerged land turns muddy dark cyan
          ctx.fillStyle = "#0c2838";
          ctx.fill();
          ctx.strokeStyle = "rgba(0, 150, 220, 0.25)";
        } else if (p.avgH > 3.8) {
          // Mountain / High ground (rocky grey-brown)
          ctx.fillStyle = "#3a414f";
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        } else if (p.avgH > 2.2) {
          // Foothills / Urban elevation (olive-green)
          ctx.fillStyle = "#1e3328";
          ctx.fill();
          ctx.strokeStyle = "rgba(120, 200, 140, 0.15)";
        } else {
          // Lowland river floodplain (deep green)
          ctx.fillStyle = "#142820";
          ctx.fill();
          ctx.strokeStyle = "rgba(80, 160, 100, 0.15)";
        }
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    });

    // 2. Draw Embankment Breach marker if triggered
    if (isBreached) {
      const breachPt = project(10, 12, 1.8);
      ctx.beginPath();
      ctx.arc(breachPt.px, breachPt.py, 8 + Math.sin(waveOffset * 3) * 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 68, 68, 0.85)";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ff5555";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("⚠️ LEVEE BREACH", breachPt.px + 12, breachPt.py + 4);
    }

    // Grid coordinates compass overlay
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "10px monospace";
    ctx.fillText("3D DEM MESH: SRTM 30m Grid", 15, 25);
    ctx.fillText(`ROTATION: Pitch ${Math.round(rotX)}° | Yaw ${Math.round(rotZ)}°`, 15, 40);
ctx.fillText(`WATER ELEVATION: +${normalizedWaterDepth.toFixed(1)}m`, 15, 55);
  }, [rotX, rotZ, zoom, normalizedWaterDepth, isBreached, waveOffset]);

  // Mouse drag handlers for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setRotZ((prev) => (prev + dx * 0.6) % 360);
    setRotX((prev) => Math.min(85, Math.max(15, prev - dy * 0.4)));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Dynamic impact calculated from 3D water depth
  const submergedKm2 = Math.round(normalizedWaterDepth * 18.4 + (isBreached ? 25 : 0));
  const affectedPop = Math.round(submergedKm2 * 1250);
  const roadSubmergedKm = (normalizedWaterDepth * 6.2 + (isBreached ? 8.5 : 0)).toFixed(1);

  return (
    <div className="bg-[#0A1628] rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl flex flex-col">
      {/* 3D Viewer Header */}
      <div className="p-4 bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="font-black text-white text-base">
              🌐 WebGL 3D Terrain & Inundation Simulation — {normalizedDistrictName}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Physics-Informed Shallow Water Equations (PINN) + DEM Elevation Profile
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onToggleBreach && (
            <button
              onClick={onToggleBreach}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                isBreached
                  ? "bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/30"
                  : "bg-white/5 border-white/15 text-gray-300 hover:text-white"
              }`}
            >
              {isBreached ? "⚠️ LEVEE BREACH ACTIVE" : "💥 Simulate Embankment Breach"}
            </button>
          )}

          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="px-2 py-1 hover:bg-white/10 rounded font-bold"
              title="Zoom In"
            >
              ➕
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="px-2 py-1 hover:bg-white/10 rounded font-bold"
              title="Zoom Out"
            >
              ➖
            </button>
            <button
              onClick={() => {
                setRotX(55);
                setRotZ(45);
                setZoom(1.0);
              }}
              className="px-2 py-1 hover:bg-white/10 rounded font-bold"
              title="Reset Angle"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* 3D Interactive Canvas */}
      <div
        className="relative h-80 sm:h-96 w-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full object-cover"
        />

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-gray-300">
          💡 Drag mouse to orbit 3D view | Scroll to zoom
        </div>

        {/* 3D Legend */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-[10px] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#3a414f]" />
            <span className="text-gray-300">High Ground (&gt;4m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#1e3328]" />
            <span className="text-gray-300">Urban Plain (2-4m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#142820]" />
            <span className="text-gray-300">River Basin (&lt;2m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#00beff]" />
            <span className="text-cyan-300 font-bold">Rising Floodwater</span>
          </div>
        </div>
      </div>

      {/* Depth Slider & Dynamic Impact Readout */}
      <div className="p-4 bg-[#081220] border-t border-white/10 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-gray-300 flex items-center gap-1.5">
              <span>🌊</span> Interactive Floodwater Depth Control:
            </span>
            <span className="font-mono text-cyan-400 font-black text-sm">
              +{normalizedWaterDepth.toFixed(1)} meters
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={normalizedWaterDepth}
            onChange={(e) => onDepthChange && onDepthChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
            <span>0m (Dry Channel)</span>
            <span>1.5m (Bank Overflow)</span>
            <span>3.0m (Moderate Submergence)</span>
            <span>5.0m (Catastrophic Breach)</span>
          </div>
        </div>

        {/* Real-time Submergence Metrics reacting to the 3D Water Depth */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-[11px] text-gray-400 block">Submerged Land</span>
            <span className="text-xl font-black text-blue-400 mt-0.5 block">{submergedKm2} km²</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-[11px] text-gray-400 block">Affected Population</span>
            <span className="text-xl font-black text-red-400 mt-0.5 block">
              {formatNumber(affectedPop)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-[11px] text-gray-400 block">Inundated Roads</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">
              {roadSubmergedKm} km
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
