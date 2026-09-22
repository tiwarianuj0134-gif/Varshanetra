"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

interface User {
  id: string; _id?: string; name: string; email: string | null; mobile: string;
  userType: string; isActive: boolean; isVerified: boolean;
  verificationStatus: string; createdAt: string; lastLoginAt: string | null;
  stateName: string | null; districtName: string | null;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.userType !== "admin") { router.push("/dashboard"); return; }
    fetch("/api/admin/users").then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user, router]);

  const handleAction = async (userId: string, action: "activate" | "deactivate" | "approve" | "reject") => {
    setActionLoading(userId);
    try {
      await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) });
      setUsers(prev => prev.map(u => {
        const uid = u.id || u._id;
        if (uid !== userId) return u;
        if (action === "activate") return { ...u, isActive: true };
        if (action === "deactivate") return { ...u, isActive: false };
        if (action === "approve") return { ...u, isVerified: true, verificationStatus: "approved" };
        if (action === "reject") return { ...u, verificationStatus: "rejected" };
        return u;
      }));
    } catch {}
    setActionLoading(null);
  };

  const filtered = users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.mobile.includes(search) && !(u.email?.toLowerCase().includes(search.toLowerCase()))) return false;
    if (typeFilter !== "all" && u.userType !== typeFilter) return false;
    if (statusFilter === "active" && !u.isActive) return false;
    if (statusFilter === "inactive" && u.isActive) return false;
    if (statusFilter === "pending" && u.verificationStatus !== "pending") return false;
    return true;
  });

  const counts = { total: users.length, public: users.filter(u => u.userType==="public").length, government: users.filter(u => u.userType==="government").length, researcher: users.filter(u => u.userType==="researcher").length, pending: users.filter(u => u.verificationStatus==="pending").length };

  const typeColor: Record<string, string> = { public:"bg-green-500/20 text-green-400", government:"bg-blue-500/20 text-blue-400", researcher:"bg-purple-500/20 text-purple-400", admin:"bg-red-500/20 text-red-400" };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="mt-16 max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">← Admin</Link>
          <span className="text-gray-600">›</span>
          <h1 className="text-3xl font-black">👥 User Management</h1>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label:"Total Users", value:counts.total, color:"text-white", bg:"bg-white/5" },
            { label:"Public", value:counts.public, color:"text-green-400", bg:"bg-green-500/5" },
            { label:"Government", value:counts.government, color:"text-blue-400", bg:"bg-blue-500/5" },
            { label:"Researchers", value:counts.researcher, color:"text-purple-400", bg:"bg-purple-500/5" },
            { label:"Pending Verification", value:counts.pending, color:"text-yellow-400", bg:"bg-yellow-500/5 border-yellow-500/20" },
          ].map((s, i) => (
            <GlassCard key={i} className={`p-4 text-center ${s.bg}`}>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Pending approvals */}
        {counts.pending > 0 && (
          <GlassCard className="p-4 mb-6 border border-yellow-500/30 bg-yellow-500/5">
            <h3 className="font-bold text-yellow-400 mb-3">⏳ Pending Verification ({counts.pending})</h3>
            <div className="space-y-2">
              {users.filter(u => u.verificationStatus === "pending").map(u => (
                <div key={u.id} className="flex items-center gap-4 bg-white/4 rounded-xl p-3">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-white">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.mobile} · {u.userType.toUpperCase()} · Joined {timeAgo(u.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(u.id, "approve")} disabled={actionLoading===u.id}
                      className="px-3 py-1.5 rounded-lg bg-green-600/80 hover:bg-green-600 text-white text-xs font-bold transition-all disabled:opacity-50">✅ Approve</button>
                    <button onClick={() => handleAction(u.id, "reject")} disabled={actionLoading===u.id}
                      className="px-3 py-1.5 rounded-lg bg-red-600/60 hover:bg-red-600/80 text-white text-xs font-bold transition-all disabled:opacity-50">❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search name, mobile, email..."
            className="bg-white/8 border border-white/15 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none w-64" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
            <option value="all" className="bg-[#0A1628]">All Types</option>
            <option value="public" className="bg-[#0A1628]">Public</option>
            <option value="government" className="bg-[#0A1628]">Government</option>
            <option value="researcher" className="bg-[#0A1628]">Researcher</option>
            <option value="admin" className="bg-[#0A1628]">Admin</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none">
            <option value="all" className="bg-[#0A1628]">All Status</option>
            <option value="active" className="bg-[#0A1628]">Active</option>
            <option value="inactive" className="bg-[#0A1628]">Inactive</option>
            <option value="pending" className="bg-[#0A1628]">Pending Verification</option>
          </select>
          <span className="text-xs text-gray-500 self-center ml-auto">{filtered.length} users</span>
        </div>

        {/* Table */}
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead><tr><th>User</th><th>Mobile</th><th>Type</th><th>State/District</th><th>Status</th><th>Joined</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  Array.from({length: 5}).map((_,i) => (
                    <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="skeleton h-4 w-full" /></td>)}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-500">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{u.name.charAt(0)}</div>
                        <div><p className="font-medium text-white text-xs">{u.name}</p><p className="text-gray-500 text-xs">{u.email||"—"}</p></div>
                      </div>
                    </td>
                    <td className="text-gray-300 font-mono text-xs">{u.mobile}</td>
                    <td><span className={`text-xs px-2 py-0.5 rounded font-bold ${typeColor[u.userType]||"bg-white/10 text-gray-400"}`}>{u.userType}</span></td>
                    <td className="text-gray-400 text-xs">{u.stateName||"—"}{u.districtName?`, ${u.districtName}`:""}</td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-bold ${u.isActive?"text-green-400":"text-red-400"}`}>{u.isActive?"● Active":"○ Inactive"}</span>
                        {u.verificationStatus === "pending" && <span className="text-xs text-yellow-400">⏳ Pending</span>}
                        {u.isVerified && <span className="text-xs text-blue-400">✓ Verified</span>}
                      </div>
                    </td>
                    <td className="text-gray-500 text-xs">{timeAgo(u.createdAt)}</td>
                    <td className="text-gray-500 text-xs">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}</td>
                    <td>
                      <div className="flex gap-1">
                        {u.isActive ? (
                          <button onClick={() => handleAction(u.id, "deactivate")} disabled={actionLoading===u.id || u.userType==="admin"}
                            className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all disabled:opacity-40">Deactivate</button>
                        ) : (
                          <button onClick={() => handleAction(u.id, "activate")} disabled={actionLoading===u.id}
                            className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition-all disabled:opacity-40">Activate</button>
                        )}
                        {u.verificationStatus === "pending" && (
                          <button onClick={() => handleAction(u.id, "approve")} disabled={actionLoading===u.id}
                            className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-all disabled:opacity-40">Approve</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
