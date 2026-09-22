"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocale, type Locale } from "@/context/LocaleContext";

/* ── Types ───────────────────────────────────────────────────── */
interface Notification {
  id: string | number;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

/* ── Nav Config ──────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard",      icon: "⬡",  label: "Overview",          role: null },
      { href: "/map",            icon: "◈",  label: "Live Map",           role: null },
      { href: "/warnings",       icon: "⚠",  label: "Warnings",           role: null },
      { href: "/inundation",     icon: "≋",  label: "3D Inundation",      role: null },
    ],
  },
  {
    label: "Analysis",
    items: [
      { href: "/ai-observatory", icon: "◎",  label: "AI Observatory",     role: null },
      { href: "/satellite",      icon: "◻",  label: "Satellite",          role: null },
      { href: "/historical",     icon: "◷",  label: "Historical",         role: null },
      { href: "/analytics",      icon: "≈",  label: "Analytics",          role: null },
    ],
  },
  {
    label: "Action",
    items: [
      { href: "/government",     icon: "⊞",  label: "Gov Command",        role: "government" },
      { href: "/bulletin",       icon: "◫",  label: "Bulletin",           role: "government" },
      { href: "/evacuation",     icon: "⇥",  label: "Evacuation",         role: null },
      { href: "/community",      icon: "⊹",  label: "Community",          role: null },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/chat",           icon: "◈",  label: "VARSHA AI",          role: null },
      { href: "/api-docs",       icon: "⌥",  label: "Developer API",      role: null },
      { href: "/models",         icon: "⊛",  label: "Models",             role: null },
    ],
  },
];

const LANGUAGES: { code: Locale; label: string; native: string }[] = [
  { code: "en", label: "English",   native: "English"   },
  { code: "hi", label: "Hindi",     native: "हिंदी"      },
  { code: "mr", label: "Marathi",   native: "मराठी"      },
  { code: "bn", label: "Bengali",   native: "বাংলা"       },
  { code: "ta", label: "Tamil",     native: "தமிழ்"       },
  { code: "te", label: "Telugu",    native: "తెలుగు"      },
  { code: "kn", label: "Kannada",   native: "ಕನ್ನಡ"       },
  { code: "ml", label: "Malayalam", native: "മലയാളം"      },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin:       { label: "Admin",       color: "#F87171", bg: "rgba(239,68,68,0.10)",    border: "rgba(239,68,68,0.25)"    },
  government:  { label: "Gov Officer", color: "#60A5FA", bg: "rgba(59,130,246,0.10)",   border: "rgba(59,130,246,0.25)"   },
  researcher:  { label: "Researcher",  color: "#A78BFA", bg: "rgba(139,92,246,0.10)",   border: "rgba(139,92,246,0.25)"   },
  public:      { label: "Citizen",     color: "#34D399", bg: "rgba(16,185,129,0.10)",   border: "rgba(16,185,129,0.25)"   },
};

/* ── System Health Data ──────────────────────────────────────── */
const SYSTEMS = [
  { key: "INSAT-3DR", short: "SAT" },
  { key: "Radar",     short: "RAD" },
  { key: "AWS",       short: "AWS" },
  { key: "NWP",       short: "NWP" },
  { key: "AI",        short: "AI"  },
];

/* ═════════════════════════════════════════════════════════════════
   AppShell — wraps all authenticated pages
════════════════════════════════════════════════════════════════= */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();

  const [time,          setTime]          = useState<Date | null>(null);
  const [redCount,      setRedCount]      = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [showLang,      setShowLang]      = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [ticker,        setTicker]        = useState<{ district: string; state: string; level: string; rainfall: number }[]>([]);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* fetch overview for red count + ticker */
  const fetchOverview = useCallback(() => {
    fetch("/api/dashboard/overview")
      .then(r => r.json())
      .then(d => {
        setRedCount(d.warnings?.RED || 0);
      })
      .catch(() => {});
    fetch("/api/public/warnings/ticker")
      .then(r => r.json())
      .then(d => setTicker(d.ticker || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchOverview();
    const t = setInterval(fetchOverview, 60000);
    return () => clearInterval(t);
  }, [fetchOverview]);

  /* notifications */
  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0); })
      .catch(() => {});
  }, [user]);

  /* close dropdowns on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (langRef.current    && !langRef.current.contains(e.target as Node))    setShowLang(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const role = user?.userType || "public";
  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.public;
  const currentLang = LANGUAGES.find(l => l.code === locale) ?? LANGUAGES[0];

  /* ticker items doubled for seamless loop */
  const tickerItems = [...ticker, ...ticker];
  const LEVEL_COLOR: Record<string, string> = { RED: "#EF4444", ORANGE: "#F97316", YELLOW: "#EAB308", GREEN: "#10B981" };

  /* visible nav items (filter by role) */
  const canSee = (itemRole: string | null) => {
    if (!itemRole) return true;
    if (role === "admin") return true;
    return role === itemRole;
  };

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--bg-base)" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
      <aside
        style={{
          width: sidebarOpen ? 216 : 54,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          transition: "width 250ms cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          zIndex: "var(--z-nav)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            padding: sidebarOpen ? "0 14px" : "0",
            justifyContent: sidebarOpen ? "flex-start" : "center",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            gap: 10,
            cursor: "pointer",
          }}
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? "Collapse" : "Expand"}
        >
          <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>🌧️</span>
          {sidebarOpen && (
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
              VARSHANETRA
            </span>
          )}
        </div>

        {/* Nav sections */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 4px", display: "flex", flexDirection: "column", gap: 2 }} className="scrollbar-none">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              {sidebarOpen && (
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--text-dim)", padding: "10px 10px 4px",
                }}>
                  {section.label}
                </div>
              )}
              {section.items.filter(i => canSee(i.role)).map(item => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      height: 36,
                      borderRadius: "var(--r-md)",
                      padding: sidebarOpen ? "0 10px" : "0",
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      color: active ? "var(--cyan)" : "var(--text-muted)",
                      background: active ? "rgba(6,182,212,0.10)" : "transparent",
                      boxShadow: active ? "inset 0 0 0 1px rgba(6,182,212,0.18)" : "none",
                      transition: "all 200ms",
                      textDecoration: "none",
                      position: "relative",
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(148,163,184,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; } }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1, width: 18, textAlign: "center" }}>{item.icon}</span>
                    {sidebarOpen && (
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>{item.label}</span>
                    )}
                    {!sidebarOpen && (
                      <span style={{
                        position: "absolute", left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)",
                        background: "var(--bg-elevated)", border: "1px solid var(--border)",
                        borderRadius: "var(--r-sm)", padding: "4px 8px",
                        fontSize: 12, fontWeight: 500, color: "var(--text-primary)",
                        whiteSpace: "nowrap", pointerEvents: "none", opacity: 0,
                        transition: "opacity 150ms", zIndex: 999, fontFamily: "var(--font-body)",
                      }} className="nav-tooltip">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom: profile mini */}
        {user && (
          <div style={{
            borderTop: "1px solid var(--border)",
            padding: sidebarOpen ? "10px 14px" : "10px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: sidebarOpen ? "flex-start" : "center",
            flexShrink: 0,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "var(--r-sm)",
              background: "linear-gradient(135deg, var(--cyan), var(--blue))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "var(--text-on-accent)",
              flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: 10, fontFamily: "var(--font-mono)",
                  color: roleConf.color, fontWeight: 600,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                }}>
                  {roleConf.label}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ══ MAIN AREA ════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── TOP BAR ────────────────────────────────────────── */}
        <header style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 16px",
          gap: 12,
          flexShrink: 0,
          zIndex: "var(--z-raised)",
        }}>
          {/* Page title — derived from current path */}
          <TopBarTitle pathname={pathname} />

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* System nodes */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="hide-tablet">
            {SYSTEMS.map(s => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="live-dot" style={{ width: 6, height: 6 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--green)", letterSpacing: "0.05em" }}>{s.short}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "var(--border)" }} className="hide-tablet" />

          {/* RED alert badge */}
          {redCount > 0 && (
            <Link href="/warnings" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.30)",
                borderRadius: "var(--r-full)", padding: "3px 10px",
                animation: "severity-glow-red 2s ease-in-out infinite",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", display: "inline-block", flexShrink: 0 }} className="live-dot red" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--red-bright)", letterSpacing: "0.05em" }}>
                  {redCount} RED
                </span>
              </div>
            </Link>
          )}

          {/* Clock */}
          <div style={{ textAlign: "right" }} className="hide-mobile">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--cyan)", letterSpacing: "0.05em", lineHeight: 1.2 }}>
              {time ? time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em" }}>IST</div>
          </div>

          {/* Language */}
          <div style={{ position: "relative" }} ref={langRef}>
            <button
              onClick={() => setShowLang(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                height: 30, padding: "0 10px",
                background: "transparent", border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)", cursor: "pointer",
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
                color: "var(--text-secondary)", letterSpacing: "0.05em",
                transition: "all 150ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
            >
              {currentLang.code.toUpperCase()} ▾
            </button>
            {showLang && (
              <div className="dropdown-menu" style={{ right: 0, top: "calc(100% + 6px)", minWidth: 180 }}>
                <div style={{ padding: "4px 10px 8px", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-dim)" }}>
                  Interface Language
                </div>
                {LANGUAGES.map(l => (
                  <button key={l.code}
                    onClick={() => { setLocale(l.code); setShowLang(false); }}
                    className={`dropdown-item ${locale === l.code ? "active" : ""}`}
                    style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)", width: 28, display: "inline-block" }}>{l.code.toUpperCase()}</span>
                    <span style={{ fontFamily: locale === l.code ? "var(--font-deva)" : "var(--font-body)" }}>{l.native}</span>
                    {locale === l.code && <span style={{ marginLeft: "auto", color: "var(--cyan)", fontSize: 11 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          {user && (
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                onClick={() => { setShowNotifs(o => !o); setShowProfile(false); }}
                style={{
                  width: 32, height: 32, borderRadius: "var(--r-sm)",
                  background: showNotifs ? "rgba(148,163,184,0.10)" : "transparent",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", position: "relative", fontSize: 15,
                  transition: "all 150ms",
                }}
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
              {showNotifs && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  width: 320, background: "var(--bg-elevated)",
                  border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
                  boxShadow: "var(--shadow-lg)", zIndex: 500, overflow: "hidden",
                  animation: "fade-in-down 0.15s ease-out",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--cyan)", fontWeight: 500 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }} className="scrollbar-none">
                    {notifications.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
                        All caught up!
                      </div>
                    ) : notifications.slice(0, 8).map(n => (
                      <div key={n.id} style={{
                        padding: "10px 16px", borderBottom: "1px solid var(--border)",
                        background: !n.isRead ? "rgba(6,182,212,0.04)" : "transparent",
                      }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          {!n.isRead && <span className="live-dot cyan" style={{ marginTop: 5, flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{n.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)" }}>
                    <Link href="/notifications" onClick={() => setShowNotifs(false)} style={{ fontSize: 12, color: "var(--cyan)", textDecoration: "none", fontWeight: 500 }}>
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {user ? (
            <div style={{ position: "relative" }} ref={profileRef}>
              <button
                onClick={() => { setShowProfile(o => !o); setShowNotifs(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "4px 8px 4px 4px",
                  background: showProfile ? "rgba(148,163,184,0.08)" : "transparent",
                  border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                  cursor: "pointer", transition: "all 150ms",
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "var(--r-sm)",
                  background: "linear-gradient(135deg, var(--cyan), var(--blue))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "var(--text-on-accent)", flexShrink: 0,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="hide-mobile">
                  {user.name.split(" ")[0]}
                </span>
                <span style={{ color: "var(--text-dim)", fontSize: 9 }}>▾</span>
              </button>
              {showProfile && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  width: 240, background: "var(--bg-elevated)",
                  border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
                  boxShadow: "var(--shadow-lg)", zIndex: 500, overflow: "hidden",
                  animation: "fade-in-down 0.15s ease-out",
                }}>
                  {/* User card */}
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-panel)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "var(--r-md)",
                        background: "linear-gradient(135deg, var(--cyan), var(--blue))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 700, color: "var(--text-on-accent)", flexShrink: 0,
                      }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.mobile}</div>
                        <span style={{
                          display: "inline-block", marginTop: 4, padding: "1px 7px",
                          borderRadius: "var(--r-full)", fontSize: 9, fontWeight: 700,
                          fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase",
                          color: roleConf.color, background: roleConf.bg, border: `1px solid ${roleConf.border}`,
                        }}>
                          {roleConf.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div style={{ padding: "6px" }}>
                    {[
                      { href: "/profile",       icon: "👤", label: "My Profile" },
                      { href: "/notifications",  icon: "🔔", label: "Notifications", badge: unreadCount },
                      { href: "/subscribe",      icon: "📍", label: "Alert Subscriptions" },
                    ].map(item => (
                      <Link key={item.href} href={item.href}
                        onClick={() => setShowProfile(false)}
                        className="dropdown-item"
                        style={{ display: "flex", textDecoration: "none" }}
                      >
                        <span style={{ width: 20, textAlign: "center" }}>{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge ? <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, background: "var(--red-bg)", color: "var(--red)", borderRadius: "var(--r-full)", padding: "1px 6px" }}>{item.badge}</span> : null}
                      </Link>
                    ))}

                    {(role === "government" || role === "admin") && (
                      <>
                        <div className="dropdown-separator" />
                        {[
                          { href: "/government", label: "Command Center" },
                          { href: "/bulletin",   label: "Bulletin Generator" },
                        ].map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setShowProfile(false)} className="dropdown-item" style={{ display: "flex", textDecoration: "none", color: "var(--blue)" }}>
                            {item.label}
                          </Link>
                        ))}
                      </>
                    )}

                    {role === "admin" && (
                      <>
                        <div className="dropdown-separator" />
                        {[
                          { href: "/admin",        label: "Admin Dashboard" },
                          { href: "/admin/users",   label: "User Management" },
                          { href: "/admin/system",  label: "System Health" },
                        ].map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setShowProfile(false)} className="dropdown-item" style={{ display: "flex", textDecoration: "none", color: "var(--red-bright)" }}>
                            {item.label}
                          </Link>
                        ))}
                      </>
                    )}

                    <div className="dropdown-separator" />
                    <button onClick={handleLogout} className="dropdown-item" style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", color: "var(--red-bright)" }}>
                      <span style={{ width: 20, textAlign: "center", display: "inline-block" }}>🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <Link href="/login" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>Sign In</Link>
              <Link href="/register" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Register</Link>
            </div>
          )}
        </header>

        {/* ── STATUS BAR ─────────────────────────────────────── */}
        <div style={{
          height: 30, display: "flex", alignItems: "center",
          background: "rgba(7,11,20,0.60)",
          borderBottom: "1px solid var(--border)",
          padding: "0 16px", gap: 0, overflow: "hidden", flexShrink: 0,
        }}>
          {/* Left: system status */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {SYSTEMS.map(s => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="live-dot" style={{ width: 5, height: 5 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--green)", letterSpacing: "0.05em" }}>{s.short}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)" }}>LIVE</span>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 12px", flexShrink: 0 }} />

          {/* Ticker */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative", maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)" }}>
            {ticker.length > 0 ? (
              <div className="animate-ticker" style={{ display: "flex", gap: 32, whiteSpace: "nowrap", width: "max-content" }}>
                {tickerItems.map((w, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: LEVEL_COLOR[w.level] || "#fff", fontWeight: 700 }}>●</span>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{w.district}</span>
                    <span style={{ color: "var(--text-dim)" }}>{w.state}</span>
                    <span style={{ color: LEVEL_COLOR[w.level] || "#fff", fontWeight: 700 }}>{w.level}</span>
                    <span style={{ color: "var(--text-dim)" }}>{w.rainfall}mm</span>
                    <span style={{ color: "var(--border)" }}>·</span>
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                System operational — No critical alerts
              </span>
            )}
          </div>

          {/* Right: last update */}
          <div style={{ flexShrink: 0, marginLeft: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)" }}>
              UPD {time ? time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "UPD --:--"}
            </span>
          </div>
        </div>

        {/* ── PAGE CONTENT ──────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", position: "relative" }} className="scrollbar-none">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Helper: derive page title from pathname ─────────────────── */
function TopBarTitle({ pathname }: { pathname: string }) {
  const MAP: Record<string, { label: string; desc?: string }> = {
    "/dashboard":      { label: "Command Overview",     desc: "Expert intelligence dashboard" },
    "/map":            { label: "Live Rainfall Map",    desc: "Real-time station & radar data" },
    "/warnings":       { label: "Active Warnings",      desc: "Current threat intelligence" },
    "/inundation":     { label: "3D Inundation Sim",    desc: "Physics-informed flood modelling" },
    "/ai-observatory": { label: "AI Observatory",       desc: "Model performance & XAI" },
    "/satellite":      { label: "Satellite View",       desc: "INSAT-3DR imagery" },
    "/historical":     { label: "Historical Analysis",  desc: "Event replay & retrospective" },
    "/analytics":      { label: "Analytics",            desc: "Trend & pattern analysis" },
    "/government":     { label: "Government Command",   desc: "Decision support & resource dispatch" },
    "/bulletin":       { label: "Bulletin Generator",   desc: "Official communication drafts" },
    "/evacuation":     { label: "Evacuation Planning",  desc: "Route & shelter management" },
    "/community":      { label: "Community Reports",    desc: "Citizen ground-truth data" },
    "/chat":           { label: "VARSHA AI",            desc: "Intelligent flood assistant" },
    "/api-docs":       { label: "Developer API",        desc: "Integration documentation" },
    "/models":         { label: "AI Models",            desc: "Model registry & metrics" },
    "/notifications":  { label: "Notifications",        desc: "" },
    "/profile":        { label: "Profile",              desc: "Account settings" },
    "/subscribe":      { label: "Alert Subscriptions",  desc: "Manage your notifications" },
    "/admin":          { label: "Admin Panel",          desc: "System administration" },
  };

  const page = Object.entries(MAP).find(([k]) => pathname === k || (k.length > 1 && pathname.startsWith(k + "/")));
  const { label, desc } = page?.[1] ?? { label: "VARSHANETRA", desc: "" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1 }}>
        {label}
      </h1>
      {desc && (
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-dim)", fontWeight: 400 }} className="hide-mobile">
          — {desc}
        </span>
      )}
    </div>
  );
}
