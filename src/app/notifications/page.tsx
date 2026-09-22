"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface Notification {
  id: number; type: string; title: string; message: string;
  severity: string; isRead: boolean; createdAt: string; relatedId?: string;
}

const TYPE_ICONS: Record<string, string> = { warning: "⚠️", system: "⚙️", community: "👥", bulletin: "📋", info: "ℹ️" };
const SEV_COLORS: Record<string, string> = {
  danger: "border-red-500/40 bg-red-500/5",
  warning: "border-orange-500/40 bg-orange-500/5",
  success: "border-green-500/40 bg-green-500/5",
  info: "border-blue-500/40 bg-blue-500/5",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (user) fetchNotifs(); else setLoading(false); }, [user]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id: number) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter || (filter === "unread" && !n.isRead));
  const unread = notifications.filter(n => !n.isRead).length;

  // Demo notifications if user has no real ones
  const demoNotifs: Notification[] = [
    { id: 1, type: "warning", title: "🔴 RED WARNING — Mumbai, Maharashtra", message: "Extremely heavy rainfall (200mm+) expected in the next 24 hours. Population at risk: 12.5 Lakh.", severity: "danger", isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, type: "system", title: "🤖 AI Models Updated", message: "ConvLSTM model retrained with July 2026 data. Ensemble accuracy improved to 87.3%.", severity: "success", isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 3, type: "warning", title: "🟠 ORANGE ALERT — Wayanad, Kerala", message: "Very heavy rainfall forecast. Landslide risk HIGH for Sahyadri slopes.", severity: "warning", isRead: true, createdAt: new Date(Date.now() - 10800000).toISOString() },
    { id: 4, type: "community", title: "👥 New Community Report Near You", message: "Waterlogging reported at Andheri West Station, Mumbai — Severity: High", severity: "info", isRead: true, createdAt: new Date(Date.now() - 18000000).toISOString() },
    { id: 5, type: "bulletin", title: "📋 Daily Bulletin Available", message: "Today's Maharashtra weather bulletin has been generated and published.", severity: "info", isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];

  const displayNotifs = notifications.length > 0 ? filtered : (filter === "all" ? demoNotifs : demoNotifs.filter(n => n.type === filter || (filter === "unread" && !n.isRead)));

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <div className="mt-16 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black">🔔 Notifications</h1>
            <p className="text-gray-400">{unread > 0 ? `${unread} unread notification${unread>1?"s":""}` : "All caught up!"}</p>
          </div>
          <div className="flex gap-3">
            {unread > 0 && <button onClick={markAllRead} className="px-4 py-2 rounded-xl bg-white/8 border border-white/15 text-sm font-medium hover:bg-white/12 transition-all">✅ Mark all read</button>}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{id:"all",l:"All"},{id:"unread",l:`Unread ${unread>0?`(${unread})`:""}`},{id:"warning",l:"⚠️ Warnings"},{id:"system",l:"⚙️ System"},{id:"community",l:"👥 Community"},{id:"bulletin",l:"📋 Bulletins"}].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter===f.id?"bg-cyan-500/20 border-cyan-500/40 text-cyan-400":"bg-white/4 border-white/10 text-gray-400 hover:bg-white/8"}`}>
              {f.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="text-4xl mb-3 animate-spin">⚙️</div><p className="text-cyan-400">Loading notifications...</p></div>
        ) : displayNotifs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔕</div>
            <h3 className="text-xl font-bold mb-2">No Notifications</h3>
            <p className="text-gray-400">You're all caught up! We'll notify you when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayNotifs.map(n => (
              <GlassCard key={n.id}
                className={`p-4 border cursor-pointer transition-all hover:bg-white/6 ${SEV_COLORS[n.severity] || "border-white/10"} ${!n.isRead ? "ring-1 ring-cyan-500/20" : ""}`}
                onClick={() => markRead(n.id)}>
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${n.severity==="danger"?"bg-red-500/20":n.severity==="warning"?"bg-orange-500/20":n.severity==="success"?"bg-green-500/20":"bg-blue-500/20"}`}>
                    {TYPE_ICONS[n.type] || "ℹ️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-bold text-sm ${!n.isRead ? "text-white" : "text-gray-300"}`}>{n.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                        <span className="text-xs text-gray-500">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${n.severity==="danger"?"bg-red-500/20 text-red-400":n.severity==="warning"?"bg-orange-500/20 text-orange-400":n.severity==="success"?"bg-green-500/20 text-green-400":"bg-blue-500/20 text-blue-400"}`}>
                        {n.severity.toUpperCase()}
                      </span>
                      {n.type === "warning" && <Link href="/warnings" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors" onClick={e => e.stopPropagation()}>View Warning →</Link>}
                      {n.type === "bulletin" && <Link href="/bulletin" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors" onClick={e => e.stopPropagation()}>View Bulletin →</Link>}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
