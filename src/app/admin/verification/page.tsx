"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface PendingUser {
  _id: string; name: string; email?: string; mobile: string;
  userType: string; department?: string; designation?: string;
  employeeCode?: string; institution?: string; stateName?: string;
  createdAt: string; verificationStatus: string;
}

export default function VerificationQueuePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<{ id:string; note:string } | null>(null);

  useEffect(() => {
    if (user && user.userType !== "admin") { router.push("/dashboard"); return; }
    fetch("/api/admin/users?status=pending&limit=50")
      .then(r => r.json())
      .then(d => { setPending(d.users?.filter((u: PendingUser) => u.verificationStatus === "pending") || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, router]);

  const handleAction = async (userId: string, action: "approve"|"reject", note?: string) => {
    setProcessing(userId);
    try {
      await fetch("/api/admin/users", {
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ userId, action, note }),
      });
      setPending(prev => prev.filter(u => u._id !== userId));
    } catch (e) { console.error(e); }
    setProcessing(null);
    setRejectNote(null);
  };

  return (
    <div className="min-h-screen" style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="mt-16 max-w-4xl mx-auto p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">🏛️ Verification Queue</h1>
            <p style={{ color:"var(--text-secondary)" }}>Review government officer & researcher applications</p>
          </div>
          <div className="px-4 py-2 rounded-xl font-black text-lg" style={{ background:"rgba(239,68,68,0.1)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.3)" }}>
            {pending.length} Pending
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background:"var(--bg-card)" }} />)}
          </div>
        ) : pending.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-lg font-bold">Queue is clear!</p>
            <p style={{ color:"var(--text-secondary)" }}>All applications have been reviewed.</p>
          </GlassCard>
        ) : pending.map(u => (
          <GlassCard key={u._id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.3)" }}>
                {u.userType === "government" ? "🏛️" : "🔬"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-black text-lg">{u.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize" style={{ background:"rgba(251,191,36,0.1)", color:"#FBB724", border:"1px solid rgba(251,191,36,0.3)" }}>
                    ⏳ {u.userType}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
                  {u.email && <div><span style={{ color:"var(--text-tertiary)" }}>Email: </span>{u.email}</div>}
                  <div><span style={{ color:"var(--text-tertiary)" }}>Mobile: </span>{u.mobile}</div>
                  {u.department && <div><span style={{ color:"var(--text-tertiary)" }}>Dept: </span>{u.department}</div>}
                  {u.designation && <div><span style={{ color:"var(--text-tertiary)" }}>Role: </span>{u.designation}</div>}
                  {u.employeeCode && <div><span style={{ color:"var(--text-tertiary)" }}>Employee ID: </span>{u.employeeCode}</div>}
                  {u.institution && <div><span style={{ color:"var(--text-tertiary)" }}>Institution: </span>{u.institution}</div>}
                  {u.stateName && <div><span style={{ color:"var(--text-tertiary)" }}>State: </span>{u.stateName}</div>}
                  <div><span style={{ color:"var(--text-tertiary)" }}>Applied: </span>{new Date(u.createdAt).toLocaleDateString("en-IN")}</div>
                </div>

                {/* Auto-check results */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {u.email?.endsWith(".gov.in") && (
                    <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background:"rgba(34,197,94,0.1)", color:"#22C55E", border:"1px solid rgba(34,197,94,0.2)" }}>
                      ✅ Gov email verified
                    </span>
                  )}
                  {u.employeeCode && (
                    <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background:"rgba(0,212,255,0.1)", color:"#00D4FF", border:"1px solid rgba(0,212,255,0.2)" }}>
                      ✅ Employee ID present
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background:"rgba(251,191,36,0.1)", color:"#FBB724", border:"1px solid rgba(251,191,36,0.2)" }}>
                    ⏳ Manual review needed
                  </span>
                </div>

                {rejectNote?.id === u._id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full p-3 rounded-xl text-sm resize-none"
                      placeholder="Reason for rejection (will be emailed to applicant)..."
                      rows={2}
                      value={rejectNote.note}
                      onChange={e => setRejectNote({ id:u._id, note:e.target.value })}
                      style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-primary)" }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setRejectNote(null)} className="px-4 py-2 rounded-lg text-sm" style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)" }}>Cancel</button>
                      <button onClick={() => handleAction(u._id, "reject", rejectNote.note)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background:"rgba(239,68,68,0.15)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.3)" }}>
                        {processing === u._id ? "Rejecting..." : "Confirm Reject"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(u._id, "approve")} disabled={processing === u._id}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold btn-neon" style={{ background:"rgba(34,197,94,0.7)" }}>
                      {processing === u._id ? "⏳ Approving..." : "✅ APPROVE"}
                    </button>
                    <button onClick={() => setRejectNote({ id:u._id, note:"" })}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background:"rgba(239,68,68,0.1)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.3)" }}>
                      ❌ REJECT
                    </button>
                    <button className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)" }}>
                      📞 Request Info
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
