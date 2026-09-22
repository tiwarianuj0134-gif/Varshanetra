"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useLocale, type Locale } from "@/context/LocaleContext";

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "hi", label: "हिंदी",       flag: "🇮🇳" },
  { code: "mr", label: "मराठी",       flag: "🇮🇳" },
  { code: "bn", label: "বাংলা",        flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்",        flag: "🇮🇳" },
  { code: "te", label: "తెలుగు",       flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ",        flag: "🇮🇳" },
  { code: "ml", label: "മലയാളം",       flag: "🇮🇳" },
];

const NAV_ITEMS = [
  { href: "/dashboard",      label: "Dashboard",  icon: "📊" },
  { href: "/map",            label: "Live Map",   icon: "🗺️" },
  { href: "/inundation",     label: "3D Flood",   icon: "🌊" },
  { href: "/warnings",       label: "Warnings",   icon: "⚠️" },
  { href: "/evacuation",     label: "Evacuation", icon: "🏃" },
  { href: "/satellite",      label: "Satellite",  icon: "🛰️" },
  { href: "/ai-observatory", label: "AI Lab",     icon: "🤖" },
  { href: "/models",         label: "Models",     icon: "⚖️" },
  { href: "/chat",           label: "VARSHA AI",  icon: "💬" },
];

interface Notification {
  id: string | number;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

export function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();

  const [time,          setTime]          = useState<Date | null>(null);
  const [redCount,      setRedCount]      = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [showLang,      setShowLang]      = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [systems]                         = useState({ SAT: true, RAD: true, AWS: true, NWP: true, AI: true });

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then(r => r.json())
      .then(d => setRedCount(d.warnings?.RED || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0); })
      .catch(() => {});
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (langRef.current    && !langRef.current.contains(e.target as Node))    setShowLang(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setShowProfile(false);
    await logout();
    router.push("/");
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const userTypeLabel: Record<string, string> = {
    public: "Public User", government: "Gov. Officer",
    researcher: "Researcher", admin: "Admin",
  };
  const userTypeBadge: Record<string, string> = {
    public:     "bg-emerald-100 text-emerald-700 border-emerald-200",
    government: "bg-blue-100 text-blue-700 border-blue-200",
    researcher: "bg-purple-100 text-purple-700 border-purple-200",
    admin:      "bg-red-100 text-red-700 border-red-200",
  };

  // Pages where navbar is hidden
  const HIDDEN = ["/","/about","/features","/how-it-works","/contact","/login","/register","/verify-otp","/forgot-password","/reset-password","/select-role"];
  if (HIDDEN.some(r => pathname === r || (r !== "/" && pathname.startsWith(r + "?")))) return null;

  const sevColor = (s: string) => ({
    danger: "bg-red-500/15 border-red-500/20",
    warning: "bg-orange-500/15 border-orange-500/20",
    success: "bg-green-500/15 border-green-500/20",
    info: "bg-blue-500/15 border-blue-500/20",
  }[s] || "bg-white/5 border-white/10");

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[9000] h-[60px] transition-all duration-300",
      scrolled
        ? "bg-gray-900/98 backdrop-blur-2xl border-b border-gray-700 shadow-lg shadow-black/20"
        : "bg-gray-900/95 backdrop-blur-xl border-b border-gray-700"
    )}>
      <div className="flex items-center h-full px-4 gap-3">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 font-black text-lg flex-shrink-0 group mr-1">
          <span className="text-2xl group-hover:animate-float">🌧️</span>
          <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent hidden sm:block tracking-tight">VARSHANETRA</span>
        </Link>

        {/* ── Nav links ── */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap relative",
                  active
                    ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent"
                )}>
                <span className="text-sm leading-none">{item.icon}</span>
                <span>{item.label}</span>
                {active && <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1/2 h-px bg-sky-600 rounded-full" />}
              </Link>
            );
          })}
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">

          {/* System status dots */}
          <div className="hidden xl:flex items-center gap-2 mr-1">
            {Object.entries(systems).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1" title={`${k}: ${v ? "Online" : "Offline"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${v ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                <span className="text-[10px] text-gray-500 font-mono">{k}</span>
              </div>
            ))}
          </div>

          {/* RED warning badge */}
          {redCount > 0 && (
            <Link href="/warnings">
              <div className="hidden sm:flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg animate-pulse cursor-pointer hover:bg-red-100 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                <span className="text-red-700 text-xs font-bold">{redCount} RED</span>
              </div>
            </Link>
          )}

          {/* Clock */}
          <div className="hidden md:block text-right">
            <div className="text-[11px] font-mono text-sky-700 font-semibold tabular-nums">
              {time ? time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">IST</div>
          </div>

          {/* Language selector */}
          <div className="relative" ref={langRef}>
            <button onClick={() => setShowLang(!showLang)}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-slate-300 transition-all text-xs font-semibold text-gray-300">
              <span>{currentLang.flag}</span>
              <span className="hidden sm:block">{currentLang.code.toUpperCase()}</span>
              <span className="text-slate-400 text-[10px]">▾</span>
            </button>
            {showLang && (
              <div className="absolute right-0 top-11 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-lg shadow-black/20 z-50 py-1.5 animate-fade-in-down">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-4 pb-1.5 pt-0.5 font-semibold">Interface Language</p>
                {LANGUAGES.map(l => (
                  <button key={l.code}
                    onClick={() => { setLocale(l.code); setShowLang(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 transition-all",
                      locale === l.code
                        ? "text-sky-700 font-bold bg-sky-50"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    )}>
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {locale === l.code && <span className="ml-auto text-sky-600 text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                  className="relative w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-base hover:bg-gray-700 hover:border-slate-300 transition-all">
                  🔔
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-11 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-lg shadow-black/20 z-50 overflow-hidden animate-fade-in-down">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                      <span className="font-bold text-sm text-gray-200">🔔 Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-sky-600 hover:text-sky-700 transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-gray-500 text-sm">
                          <div className="text-2xl mb-2">🔕</div>
                          All caught up!
                        </div>
                      ) : notifications.slice(0, 8).map(n => (
                        <div key={n.id}
                          className={cn("px-4 py-3 border-b border-gray-700 hover:bg-gray-800 transition-all cursor-pointer",
                            !n.isRead && "bg-sky-50")}>
                          <div className="flex items-start gap-2.5">
                            {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-sky-600 flex-shrink-0 mt-1.5" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-200 leading-snug">{n.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-gray-700 bg-gray-800">
                      <Link href="/notifications" onClick={() => setShowNotifs(false)}
                        className="text-xs text-sky-600 hover:text-sky-700 transition-colors font-medium">
                        View all notifications →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile button */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-slate-300 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-300 hidden sm:block max-w-[80px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                  <span className="text-slate-400 text-[10px]">▾</span>
                </button>

                {showProfile && (
                  <div className="absolute right-0 top-11 w-60 bg-gray-900 border border-gray-700 rounded-2xl shadow-lg shadow-black/20 z-50 overflow-hidden animate-fade-in-down">
                    {/* User header */}
                    <div className="px-4 py-4 border-b border-gray-700 bg-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-lg font-black text-white flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-200 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.mobile}</p>
                          <span className={cn("inline-block mt-1 text-[10px] px-2 py-0.5 rounded-lg font-bold border",
                            userTypeBadge[user.userType] || "bg-gray-700 text-gray-400 border-gray-700")}>
                            {userTypeLabel[user.userType] || "User"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Common links */}
                    <div className="py-1.5">
                      {[
                        { href:"/profile",       icon:"👤", label:"My Profile",       sub:"Settings & preferences" },
                        { href:"/notifications",  icon:"🔔", label:"Notifications",    sub: unreadCount > 0 ? `${unreadCount} unread` : "All caught up" },
                        { href:"/subscribe",      icon:"📍", label:"My Alerts",        sub:"Manage subscriptions" },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-all group">
                          <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                          <div>
                            <p className="text-sm text-gray-200 font-medium group-hover:text-sky-700 transition-colors">{item.label}</p>
                            <p className="text-[10px] text-gray-500">{item.sub}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Admin links */}
                    {user.userType === "admin" && (
                      <div className="border-t border-gray-700 py-1.5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider px-4 py-1 font-semibold">Admin Panel</p>
                        {[
                          { href:"/admin",        label:"⚙️ Dashboard" },
                          { href:"/admin/users",   label:"👥 User Management" },
                          { href:"/admin/system",  label:"🖥️ System Health" },
                          { href:"/admin/models",  label:"🤖 Model Management" },
                        ].map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setShowProfile(false)}
                            className="flex items-center px-4 py-2 hover:bg-red-50 transition-all">
                            <p className="text-sm text-red-600 font-medium">{item.label}</p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Government links */}
                    {(user.userType === "government" || user.userType === "admin") && (
                      <div className={cn("py-1.5", user.userType !== "admin" && "border-t border-gray-700")}>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider px-4 py-1 font-semibold">Command Tools</p>
                        {[
                          { href:"/government", label:"🏛️ Command Center" },
                          { href:"/bulletin",   label:"📋 Bulletin Generator" },
                        ].map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setShowProfile(false)}
                            className="flex items-center px-4 py-2 hover:bg-blue-50 transition-all">
                            <p className="text-sm text-blue-600 font-medium">{item.label}</p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* More pages */}
                    <div className="border-t border-gray-700 py-1.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider px-4 py-1 font-semibold">More</p>
                      {[
                        { href:"/compare",      label:"⚖️ Compare Districts" },
                        { href:"/historical",   label:"📜 Disaster Archive" },
                        { href:"/architecture", label:"🏗️ Architecture" },
                        { href:"/api-docs",     label:"📖 API Docs" },
                        { href:"/community",    label:"👥 Community Reports" },
                        { href:"/offline",      label:"📶 Low-Bandwidth Mode" },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setShowProfile(false)}
                          className="flex items-center px-4 py-1.5 hover:bg-gray-800 transition-all">
                          <p className="text-xs text-gray-400 hover:text-gray-200 transition-colors">{item.label}</p>
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-700 py-1.5">
                      <button onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all rounded-b-2xl">
                        <span className="text-base">🚪</span>
                        <span className="font-semibold">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="h-8 px-4 rounded-lg border border-slate-300 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:border-slate-400 hover:text-gray-200 transition-all">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="h-8 px-4 text-xs rounded-lg font-bold bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 shadow-sm hover:shadow transition-all">
                  Sign Up
                </button>
              </Link>
            </div>
          )}

          {/* Live indicator */}
          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" title="System Live" />
        </div>
      </div>
    </nav>
  );
}
