"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/lib/auth-context";
import { INDIAN_DISTRICTS } from "@/lib/seed-data";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "personal", label: "👤 Personal Info", icon: "👤" },
  { id: "alerts", label: "🔔 Alert Preferences", icon: "🔔" },
  { id: "security", label: "🔐 Security", icon: "🔐" },
  { id: "notifications", label: "🔕 Notifications", icon: "🔕" },
  { id: "language", label: "🌐 Language", icon: "🌐" },
];

const STATES = ["Maharashtra","Kerala","Assam","West Bengal","Uttarakhand","Tamil Nadu","Odisha","Karnataka","Gujarat","Telangana","Uttar Pradesh","Bihar","Himachal Pradesh","Andhra Pradesh"];
const LANGUAGES = ["English","हिंदी","मराठी","বাংলা","தமிழ்","తెలుగు","ಕನ್ನಡ","മലയാളം"];

export default function ProfilePage() {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", mobile: "", stateName: "", districtName: "",
    language: "English", alertChannels: ["sms"] as string[],
    alertLevels: ["RED","ORANGE"] as string[], subscribedDistricts: [] as string[],
    quietHoursFrom: "22:00", quietHoursTo: "06:00",
    emailNotifications: true, smsNotifications: true, pushNotifications: false,
    marketingEmails: false,
  });

  const [passForm, setPassForm] = useState({ current: "", newPass: "", confirm: "" });

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        stateName: user.stateName || "",
        districtName: user.districtName || "",
        language: user.language || "English",
        alertChannels: (user.alertChannels as string[]) || ["sms"],
        alertLevels: (user.alertLevels as string[]) || ["RED","ORANGE"],
        subscribedDistricts: (user.subscribedDistricts as string[]) || [],
      }));
    } else if (!user) {
      // Not checking loading here — let the page render and redirect if needed
    }
  }, [user]);

  const update = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (key: "alertChannels" | "alertLevels" | "subscribedDistricts", val: string) =>
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter((x: string) => x !== val) : [...f[key], val] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/auth/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passForm.newPass !== passForm.confirm) { alert("Passwords don't match"); return; }
    setChangingPass(true);
    await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword: passForm.newPass, currentPassword: passForm.current }) });
    setChangingPass(false);
    setPassForm({ current:"", newPass:"", confirm:"" });
    alert("Password changed successfully!");
  };

  const stateDistricts = INDIAN_DISTRICTS.filter(d => d.state === form.stateName);

  if (!user) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center"><p className="text-[var(--text-secondary)] mb-4">Please login to view your profile</p><button onClick={() => router.push("/login")} className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 transition-all shadow-sm">Login</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <div className="mt-16 max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-black mb-6">👤 My Profile & Settings</h1>

        <div className="flex gap-6">
          {/* Left Menu */}
          <aside className="w-52 flex-shrink-0">
            {/* Avatar Card */}
            <GlassCard className="p-4 text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-black mx-auto mb-3">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <p className="font-bold text-sm text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{user.mobile}</p>
              <span className={cn("inline-block mt-2 text-xs px-2 py-0.5 rounded font-semibold",
                user.userType==="admin"?"bg-red-500/20 text-red-400":user.userType==="government"?"bg-blue-500/20 text-blue-400":user.userType==="researcher"?"bg-purple-500/20 text-purple-400":"bg-green-500/20 text-green-400")}>
                {user.userType === "government" ? "🏛️ Gov. Officer" : user.userType === "admin" ? "⚙️ Admin" : user.userType === "researcher" ? "🔬 Researcher" : "👤 Public User"}
              </span>
            </GlassCard>

            <div className="space-y-1">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={cn("w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    section===s.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
                  {s.label}
                </button>
              ))}
              <div className="pt-2 border-t border-white/8">
                <button onClick={() => logout().then(() => router.push("/"))}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                  🚪 Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {saved && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-400 text-sm text-center font-bold animate-fade-in">✅ Settings saved successfully!</div>}

            {section === "personal" && (
              <GlassCard className="p-6 space-y-4">
                <h2 className="font-black text-xl">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">Full Name</label>
                    <input value={form.name} onChange={e => update("name", e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">Email Address</label>
                    <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="your@email.com" className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">Mobile Number</label>
                    <input value={form.mobile} disabled className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-gray-500 text-sm cursor-not-allowed" />
                    <p className="text-xs text-gray-600 mt-1">Mobile number cannot be changed</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">State</label>
                    <select value={form.stateName} onChange={e => update("stateName", e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm">
                      <option value="" className="bg-[#0A1628]">Select State</option>
                      {STATES.map(s => <option key={s} value={s} className="bg-[#0A1628]">{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">District</label>
                    <select value={form.districtName} onChange={e => update("districtName", e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm">
                      <option value="" className="bg-[#0A1628]">Select District</option>
                      {stateDistricts.map(d => <option key={d.code} value={d.name} className="bg-[#0A1628]">{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">Account Type</label>
                    <div className={cn("px-4 py-3 rounded-xl text-sm border", user.userType==="government"?"bg-blue-500/10 border-blue-500/30 text-blue-400":user.userType==="admin"?"bg-red-500/10 border-red-500/30 text-red-400":"bg-green-500/10 border-green-500/30 text-green-400")}>
                      {user.userType === "government" ? "🏛️ Government Officer" : user.userType === "admin" ? "⚙️ Administrator" : user.userType === "researcher" ? "🔬 Researcher" : "👤 Public User"}
                    </div>
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-neon px-8 py-3 rounded-xl font-bold disabled:opacity-50">
                  {saving ? "⏳ Saving..." : "💾 Save Changes"}
                </button>
              </GlassCard>
            )}

            {section === "alerts" && (
              <GlassCard className="p-6 space-y-5">
                <h2 className="font-black text-xl">Alert Preferences</h2>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block font-medium">Alert Levels</label>
                  <div className="space-y-2">
                    {[{l:"RED",lbl:"🔴 RED Warnings",req:true},{l:"ORANGE",lbl:"🟠 ORANGE Alerts"},{l:"YELLOW",lbl:"🟡 YELLOW Watch"}].map(a => (
                      <label key={a.l} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all", form.alertLevels.includes(a.l)?"bg-white/8 border-white/20":"bg-white/4 border-white/8")}>
                        <input type="checkbox" checked={form.alertLevels.includes(a.l)} onChange={() => !a.req && toggleArr("alertLevels", a.l)} disabled={a.req} className="accent-cyan-500" />
                        <span className="text-sm text-white">{a.lbl}</span>
                        {a.req && <span className="ml-auto text-xs text-red-400">Required</span>}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block font-medium">Alert Channels</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{id:"sms",l:"💬 SMS"},{id:"whatsapp",l:"📱 WhatsApp"},{id:"email",l:"📧 Email"},{id:"push",l:"🔔 Push"}].map(c => (
                      <label key={c.id} className={cn("flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all", form.alertChannels.includes(c.id)?"bg-cyan-500/10 border-cyan-500/40":"bg-white/4 border-white/8")}>
                        <input type="checkbox" checked={form.alertChannels.includes(c.id)} onChange={() => toggleArr("alertChannels", c.id)} className="accent-cyan-500" />
                        <span className="text-sm text-white">{c.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block font-medium">Subscribed Districts (max 5)</label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
                    {INDIAN_DISTRICTS.slice(0, 30).map(d => (
                      <button key={d.code} onClick={() => form.subscribedDistricts.length < 5 || form.subscribedDistricts.includes(d.code) ? toggleArr("subscribedDistricts", d.code) : null}
                        className={cn("text-left p-2 rounded-lg border text-xs transition-all", form.subscribedDistricts.includes(d.code)?"bg-cyan-500/20 border-cyan-500/40 text-cyan-400":"bg-white/4 border-white/8 text-gray-400 hover:bg-white/8", form.subscribedDistricts.length >= 5 && !form.subscribedDistricts.includes(d.code) && "opacity-40 cursor-not-allowed")}>
                        <p className="font-bold text-white">{d.name}</p><p>{d.state}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-cyan-400 mt-2">{form.subscribedDistricts.length}/5 selected</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-neon px-8 py-3 rounded-xl font-bold disabled:opacity-50">{saving ? "⏳ Saving..." : "💾 Save Preferences"}</button>
              </GlassCard>
            )}

            {section === "security" && (
              <GlassCard className="p-6 space-y-5">
                <h2 className="font-black text-xl">Security Settings</h2>
                <div className="p-4 bg-white/4 rounded-xl border border-white/10">
                  <h3 className="font-bold mb-3">Change Password</h3>
                  <div className="space-y-3">
                    <input type="password" value={passForm.current} onChange={e => setPassForm(f => ({...f, current:e.target.value}))} placeholder="Current password" className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                    <input type="password" value={passForm.newPass} onChange={e => setPassForm(f => ({...f, newPass:e.target.value}))} placeholder="New password (min 8 chars)" className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                    <input type="password" value={passForm.confirm} onChange={e => setPassForm(f => ({...f, confirm:e.target.value}))} placeholder="Confirm new password" className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                    <button onClick={handleChangePassword} disabled={changingPass || !passForm.current || !passForm.newPass}
                      className="btn-neon px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">{changingPass ? "⏳ Changing..." : "🔐 Change Password"}</button>
                  </div>
                </div>
                <div className="p-4 bg-white/4 rounded-xl border border-white/10">
                  <h3 className="font-bold mb-2">Active Sessions</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between items-center"><span>Current Session (this device)</span><span className="text-green-400 font-bold">● Active</span></div>
                  </div>
                </div>
                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                  <h3 className="font-bold text-red-400 mb-2">⚠️ Danger Zone</h3>
                  {!deleteConfirm ? (
                    <button onClick={() => setDeleteConfirm(true)} className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all">🗑️ Delete Account</button>
                  ) : (
                    <div>
                      <p className="text-sm text-red-300 mb-3">This action is irreversible. All your data will be permanently deleted.</p>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all">Confirm Delete</button>
                        <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 rounded-lg bg-white/8 text-sm font-medium hover:bg-white/12 transition-all">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {section === "notifications" && (
              <GlassCard className="p-6 space-y-4">
                <h2 className="font-black text-xl">Notification Preferences</h2>
                {[
                  {k:"emailNotifications",l:"📧 Email notifications for warnings"},
                  {k:"smsNotifications",l:"💬 SMS alerts for RED/ORANGE warnings"},
                  {k:"pushNotifications",l:"🔔 Browser push notifications"},
                  {k:"marketingEmails",l:"📰 Newsletter & product updates"},
                ].map(item => (
                  <label key={item.k} className={cn("flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all", (form as Record<string,unknown>)[item.k]?"bg-white/8 border-white/20":"bg-white/4 border-white/8")}>
                    <span className="text-sm text-white">{item.l}</span>
                    <div className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", (form as Record<string,unknown>)[item.k]?"bg-cyan-500":"bg-white/20")}
                      onClick={() => update(item.k, !(form as Record<string,unknown>)[item.k])}>
                      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", (form as Record<string,unknown>)[item.k]?"translate-x-6":"translate-x-1")} />
                    </div>
                  </label>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-gray-400 mb-1.5 block font-medium">Quiet Hours From</label><input type="time" value={form.quietHoursFrom} onChange={e => update("quietHoursFrom",e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm" /></div>
                  <div><label className="text-xs text-gray-400 mb-1.5 block font-medium">Quiet Hours To</label><input type="time" value={form.quietHoursTo} onChange={e => update("quietHoursTo",e.target.value)} className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm" /></div>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-neon px-8 py-3 rounded-xl font-bold disabled:opacity-50">{saving?"⏳ Saving...":"💾 Save Preferences"}</button>
              </GlassCard>
            )}

            {section === "language" && (
              <GlassCard className="p-6 space-y-5">
                <h2 className="font-black text-xl">Language Settings</h2>
                <div>
                  <label className="text-sm text-gray-400 mb-3 block font-medium">Alert & Interface Language</label>
                  <div className="grid grid-cols-4 gap-2">
                    {LANGUAGES.map(l => (
                      <button key={l} onClick={() => update("language", l)}
                        className={cn("py-3 rounded-xl border text-sm transition-all font-medium", form.language===l?"bg-cyan-500/20 border-cyan-500/50 text-cyan-400":"bg-white/4 border-white/8 text-gray-400 hover:bg-white/8")}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                  <p className="text-sm text-cyan-300">🌟 Alert messages, forecast bulletins, and community reports will be delivered in your selected language.</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-neon px-8 py-3 rounded-xl font-bold disabled:opacity-50">{saving?"⏳ Saving...":"💾 Save Language"}</button>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
