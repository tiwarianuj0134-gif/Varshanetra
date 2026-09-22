"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RainCanvas } from "@/components/landing/RainCanvas";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const STATES = [
  "Andhra Pradesh","Assam","Bihar","Gujarat","Himachal Pradesh","Jharkhand",
  "Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya",
  "Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar","Chandigarh","Delhi","Goa","Jammu & Kashmir","Ladakh",
];

const DISTRICT_MAP: Record<string, string[]> = {
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Ratnagiri","Kolhapur","Satara","Aurangabad"],
  "Kerala": ["Ernakulam","Thiruvananthapuram","Kozhikode","Wayanad","Idukki","Palakkad","Thrissur"],
  "Assam": ["Kamrup","Dibrugarh","Silchar","Guwahati","Nalbari","Barpeta","Jorhat"],
  "West Bengal": ["Kolkata","Darjeeling","Howrah","Murshidabad","Malda","Siliguri"],
  "Uttarakhand": ["Dehradun","Haridwar","Chamoli","Uttarkashi","Pithoragarh","Nainital"],
  "Tamil Nadu": ["Chennai","Coimbatore","Nilgiris","Thanjavur","Vellore","Madurai"],
  "Odisha": ["Bhubaneswar","Puri","Cuttack","Ganjam","Kendrapara"],
  "Karnataka": ["Bengaluru","Mangaluru","Mysuru","Udupi","Dakshina Kannada"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Kutch","Rajkot"],
  "Telangana": ["Hyderabad","Warangal","Khammam","Nizamabad"],
};

const USER_TYPES = [
  { id: "public", label: "👤 Public User", desc: "Kisan, Common Man, General Public" },
  { id: "government", label: "🏛️ Government Officer", desc: "IMD, NDMA, SDMA, Collector" },
  { id: "researcher", label: "🔬 Researcher", desc: "IMD Scientist, Academic" },
];

const LANGUAGES = ["English","हिंदी","मराठी","বাংলা","தமிழ்","తెలుగు","ಕನ್ನಡ","മലയാളം"];

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  // Read role from URL param so /register?role=government auto-selects type
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const roleFromUrl = searchParams?.get("role") || "public";
  const [userType, setUserType] = useState(["public","government","researcher"].includes(roleFromUrl) ? roleFromUrl : "public");
  const [step, setStep] = useState(1);
  const [loading2, setLoading2] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", mobile: "", password: "", confirmPassword: "",
    stateName: "", districtName: "", language: "English",
    alertChannels: ["sms"] as string[], alertLevels: ["RED","ORANGE"] as string[],
    agreeTerms: false, newsletter: false,
    // Government
    employeeCode: "", department: "", designation: "", officeLocation: "",
    // Researcher
    institution: "", researchField: "", orcidId: "",
  });

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const passwordStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabel = ["", "Weak","Fair","Good","Strong"][strength];
  const strengthColor = ["","bg-red-500","bg-orange-500","bg-yellow-500","bg-green-500"][strength];

  const districts = DISTRICT_MAP[form.stateName] || [];

  const update = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleArr = (key: "alertChannels" | "alertLevels", val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.agreeTerms) { setError("Please agree to Terms & Conditions"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (strength < 2) { setError("Password too weak"); return; }
    setLoading2(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      const demoOtp = data.demoOtp || "";
      router.push(`/verify-otp?mobile=${encodeURIComponent(form.mobile)}&purpose=register${demoOtp ? `&demoOtp=${demoOtp}` : ""}`);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading2(false); }
  };

  // Show loading / redirecting spinner — never a blank screen
  if (loading || user) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>🌧️</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            {user ? "REDIRECTING…" : "LOADING"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#060E1A]">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-5/12 relative flex-col items-center justify-center overflow-hidden bg-[#0A1628]">
        <RainCanvas />
        <div className="relative z-10 text-center px-10">
          <div className="text-7xl mb-6">🌧️</div>
          <h1 className="text-4xl font-black mb-3" style={{
            background: "linear-gradient(135deg,#00D4FF,#3B82F6,#A855F7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>VARSHANETRA</h1>
          <p className="text-lg text-blue-200 mb-8">AI-Powered Rainfall & Flood Intelligence</p>
          <div className="space-y-4 text-left">
            {["Real-time alerts for your district","AI predictions 72h ahead","Community flood reporting","Multi-language support"].map((f,i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">✓</div>
                <span className="text-sm text-gray-300">{f}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-gray-500 text-sm">Join 50,000+ users staying safe with VARSHANETRA</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-4 transition-colors">
              ← Back to Home
            </Link>
            <h2 className="text-3xl font-black text-white">Create Your Account</h2>
            <p className="text-gray-400 mt-1">Get personalized weather alerts & flood warnings</p>
          </div>

          {/* User Type Toggle */}
          <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/10">
            {USER_TYPES.map(t => (
              <button key={t.id} onClick={() => setUserType(t.id)}
                className={cn("px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-center",
                  userType === t.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "text-gray-400 hover:text-white"
                )}>
                <div>{t.label}</div>
                <div className="text-gray-500 text-xs mt-0.5 hidden sm:block">{t.desc}</div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Full Name *</label>
                <input value={form.name} onChange={e => update("name", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Email Address</label>
                <input type="email" value={form.email} onChange={e => update("email", e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Mobile Number *</label>
                <div className="flex">
                  <span className="bg-white/8 border border-r-0 border-white/15 rounded-l-xl px-3 py-3 text-gray-400 text-sm">+91</span>
                  <input value={form.mobile} onChange={e => update("mobile", e.target.value.replace(/\D/g,"").slice(0,10))}
                    placeholder="10-digit number"
                    className="flex-1 bg-white/8 border border-white/15 rounded-r-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Password *</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 pr-10 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-500 hover:text-white text-xs">
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={cn("h-1 flex-1 rounded-full", i <= strength ? strengthColor : "bg-white/10")} />
                      ))}
                    </div>
                    <span className={cn("text-xs font-medium", strength>=3?"text-green-400":strength>=2?"text-yellow-400":"text-red-400")}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Confirm Password *</label>
                <input type="password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)}
                  placeholder="Repeat password"
                  className={cn("w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-sm transition-all",
                    form.confirmPassword && form.password !== form.confirmPassword ? "border-red-500/60" : "border-white/15 focus:border-cyan-500")} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">State *</label>
                <select value={form.stateName} onChange={e => { update("stateName", e.target.value); update("districtName",""); }}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm">
                  <option value="" className="bg-[#0A1628]">Select State</option>
                  {STATES.map(s => <option key={s} value={s} className="bg-[#0A1628]">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                  {districts.length > 0 ? "District" : "Complete Address *"}
                </label>
                {districts.length > 0 ? (
                  <select value={form.districtName} onChange={e => update("districtName", e.target.value)}
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm">
                    <option value="" className="bg-[#0A1628]">Select District</option>
                    {districts.map(d => <option key={d} value={d} className="bg-[#0A1628]">{d}</option>)}
                  </select>
                ) : (
                  <input 
                    value={form.districtName} 
                    onChange={e => update("districtName", e.target.value)}
                    placeholder="Enter your complete address"
                    className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm"
                  />
                )}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Language</label>
                <select value={form.language} onChange={e => update("language", e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-sm">
                  {LANGUAGES.map(l => <option key={l} value={l} className="bg-[#0A1628]">{l}</option>)}
                </select>
              </div>
            </div>

            {/* Government extra fields */}
            {userType === "government" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <p className="col-span-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">🏛️ Government Details</p>
                <input value={form.employeeCode} onChange={e => update("employeeCode", e.target.value)} placeholder="Employee/ID Code *"
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                <input value={form.department} onChange={e => update("department", e.target.value)} placeholder="Department (IMD/NDMA/SDMA)"
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                <input value={form.designation} onChange={e => update("designation", e.target.value)} placeholder="Designation"
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                <input value={form.officeLocation} onChange={e => update("officeLocation", e.target.value)} placeholder="Office Location"
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                <p className="col-span-2 text-xs text-yellow-400 bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                  ⚠️ Government accounts require manual verification (1-2 working days).
                </p>
              </div>
            )}

            {/* Researcher extra fields */}
            {userType === "researcher" && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                <p className="col-span-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">🔬 Research Details</p>
                <input value={form.institution} onChange={e => update("institution", e.target.value)} placeholder="Institution/University *"
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                <input value={form.researchField} onChange={e => update("researchField", e.target.value)} placeholder="Research Field"
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
                <input value={form.orcidId} onChange={e => update("orcidId", e.target.value)} placeholder="ORCID ID (optional)"
                  className="col-span-2 bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-sm" />
              </div>
            )}

            {/* Alert preferences */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium">Alert Channels</label>
              <div className="flex gap-2 flex-wrap">
                {[{id:"sms",l:"💬 SMS"},{id:"whatsapp",l:"📱 WhatsApp"},{id:"email",l:"📧 Email"},{id:"push",l:"🔔 Push"}].map(c => (
                  <button key={c.id} onClick={() => toggleArr("alertChannels", c.id)}
                    className={cn("px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                      form.alertChannels.includes(c.id) ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}>{c.l}</button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agreeTerms} onChange={e => update("agreeTerms", e.target.checked)} className="mt-0.5 accent-cyan-500" />
                <span className="text-sm text-gray-300">I agree to the <Link href="/terms" className="text-cyan-400 hover:underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link> *</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.newsletter} onChange={e => update("newsletter", e.target.checked)} className="accent-cyan-500" />
                <span className="text-sm text-gray-400">Subscribe to monthly weather newsletter</span>
              </label>
            </div>

            <button onClick={handleSubmit} disabled={loading2 || !form.name || !form.mobile || !form.password || !form.agreeTerms}
              className="w-full py-4 rounded-xl font-black text-base btn-neon disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading2 ? "⏳ Creating Account..." : "🚀 Create Account & Verify"}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
