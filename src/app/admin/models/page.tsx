"use client";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { MODEL_CONFIG } from "@/lib/seed-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ModelData {
  id: string; name: string; description: string; accuracy: number; color: string; speciality: string;
  latest: { rmse: number; csi: number; pod: number; far: number; correlation: number; accuracy: number } | null;
  history: { date: string; accuracy: number; rmse: number }[];
  processingTime: string; status: string;
}

const MODEL_VERSIONS = [
  { model: "convlstm", version: "2.3.1", prev: "2.2.0", deployed: "2026-07-01", change: "+2.1% accuracy" },
  { model: "unet", version: "1.8.0", prev: "1.7.2", deployed: "2026-06-15", change: "+1.3% accuracy" },
  { model: "transformer", version: "3.1.2", prev: "3.0.1", deployed: "2026-07-05", change: "+3.2% accuracy" },
  { model: "xgboost", version: "4.2.0", prev: "4.1.5", deployed: "2026-07-10", change: "+0.8% accuracy" },
  { model: "ensemble", version: "1.5.0", prev: "1.4.0", deployed: "2026-07-10", change: "+1.5% accuracy" },
];

export default function ModelManagementPage() {
  const { user } = useAuth();
  const [aiData, setAiData] = useState<{ models: ModelData[]; learningCurve: { month: string; accuracy: number; rmse: number }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState<string | null>(null);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);
  const [abTest, setAbTest] = useState(false);

  useEffect(() => {
    fetch("/api/ai/models").then(r => r.json()).then(d => { setAiData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleRetrain = async (modelId: string) => {
    setRetraining(modelId);
    setRetrainMsg(null);
    await new Promise(r => setTimeout(r, 3000)); // Simulate
    setRetraining(null);
    setRetrainMsg(`✅ ${MODEL_CONFIG.find(m => m.id === modelId)?.name} retraining scheduled! Will complete in ~2 hours.`);
    setTimeout(() => setRetrainMsg(null), 6000);
  };

  if (!user || user.userType !== "admin") {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-red-400 font-bold mb-4">Admin access required</p>
          <Link href="/login"><button className="btn-neon px-6 py-3 rounded-xl font-bold">Login</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="mt-16 max-w-7xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <Link href="/admin" className="hover:text-white transition-colors">← Admin</Link>
          <span>›</span>
          <span className="text-white">Model Management</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black">🤖 AI Model Management</h1>
            <p className="text-gray-400">Deploy, monitor, and retrain VARSHANETRA AI models</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-400">A/B Testing</span>
              <div onClick={() => setAbTest(!abTest)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${abTest ? "bg-cyan-500" : "bg-white/20"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-transparent transition-transform ${abTest ? "translate-x-6" : "translate-x-1"}`} />
              </div>
            </label>
          </div>
        </div>

        {retrainMsg && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-xl text-green-400 font-bold animate-fade-in">
            {retrainMsg}
          </div>
        )}

        {/* Model Cards */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {MODEL_CONFIG.map(model => {
            const mData = aiData?.models.find(m => m.id === model.id);
            const version = MODEL_VERSIONS.find(v => v.model === model.id);
            return (
              <GlassCard key={model.id} className="p-4 border" style={{ borderColor: `${model.color}30` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: model.color }} />
                  <span className="text-xs font-mono text-gray-500">v{version?.version}</span>
                </div>
                <h3 className="font-black text-sm mb-1" style={{ color: model.color }}>{model.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{model.speciality}</p>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-black text-white">{mData?.accuracy || model.accuracy}%</p>
                    <p className="text-xs text-gray-500">Accuracy</p>
                  </div>
                  <CircularProgress value={mData?.accuracy || model.accuracy} size={48} />
                </div>

                {mData?.latest && (
                  <div className="space-y-1 text-xs mb-3 border-t border-white/8 pt-2">
                    <div className="flex justify-between"><span className="text-gray-500">RMSE</span><span className="text-yellow-400">{mData.latest.rmse?.toFixed(1)}mm</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">CSI</span><span className="text-green-400">{mData.latest.csi?.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">POD</span><span className="text-cyan-400">{mData.latest.pod?.toFixed(2)}</span></div>
                  </div>
                )}

                <button
                  onClick={() => handleRetrain(model.id)}
                  disabled={retraining === model.id}
                  className="w-full py-2 rounded-lg text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  style={{ borderColor: retraining === model.id ? model.color : undefined }}>
                  {retraining === model.id ? (
                    <><span className="animate-spin">⚙️</span> Scheduling...</>
                  ) : (
                    "🔄 Retrain"
                  )}
                </button>
              </GlassCard>
            );
          })}
        </div>

        {/* Learning Curve */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <GlassCard className="p-5">
            <h2 className="font-bold text-lg mb-4">📈 Ensemble Accuracy Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={aiData?.learningCurve || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#666" }} />
                <YAxis domain={[65, 95]} tick={{ fontSize: 11, fill: "#666" }} />
                <Tooltip contentStyle={{ background: "#0A1628", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#00D4FF" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="rmse" name="RMSE (mm)" stroke="#FF6B00" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-bold text-lg mb-4">🗂️ Version History</h2>
            <div className="space-y-2">
              {MODEL_VERSIONS.map((v, i) => {
                const m = MODEL_CONFIG.find(mc => mc.id === v.model);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/4 rounded-xl border border-white/8">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m?.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{m?.name}</p>
                      <p className="text-xs text-gray-500">{v.prev} → {v.version}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-green-400 font-bold">{v.change}</p>
                      <p className="text-xs text-gray-600">{v.deployed}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Model Config Table */}
        <GlassCard className="p-5">
          <h2 className="font-bold text-lg mb-4">⚙️ Model Configuration</h2>
          <table className="w-full text-sm data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Architecture</th>
                <th>Speciality</th>
                <th>Accuracy</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_CONFIG.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="font-bold" style={{ color: m.color }}>{m.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-400">{m.description.split(" ").slice(0, 4).join(" ")}...</td>
                  <td className="text-gray-300">{m.speciality}</td>
                  <td className="text-yellow-400 font-bold">{m.accuracy}%</td>
                  <td><span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded font-bold">● PRODUCTION</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-all">📊 Metrics</button>
                      <button onClick={() => handleRetrain(m.id)} disabled={retraining === m.id}
                        className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition-all disabled:opacity-40">
                        {retraining === m.id ? "⏳" : "🔄 Retrain"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
