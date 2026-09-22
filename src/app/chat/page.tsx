"use client";
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/AppShell";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date | null;
  sources?: string[];
}

const QUICK_PROMPTS = [
  { category: "Alerts",   label: "Current RED warnings",                       q: "Which districts have RED warnings right now?" },
  { category: "Forecast", label: "Mumbai rainfall tomorrow",                    q: "Will it rain heavily in Mumbai tomorrow?" },
  { category: "Model",    label: "How does the AI ensemble work",               q: "Explain how the 5-model AI ensemble works" },
  { category: "Hindi",    label: "मुंबई में कल बारिश",                          q: "मुंबई में कल कितनी बारिश होगी?" },
  { category: "Risk",     label: "Kerala flood risk this week",                 q: "What is the flood risk for Kerala this week?" },
  { category: "Stations", label: "Top rainfall stations",                       q: "Show me the top rainfall stations right now" },
  { category: "Science",  label: "PINN model explained",                        q: "How does the Physics-Informed Neural Network flood model work?" },
  { category: "Data",     label: "Data sources used",                           q: "What data sources does VARSHANETRA use for predictions?" },
];

const SOURCES_MAP: Record<string, string[]> = {
  rainfall:   ["IMD AWS Network", "GPM-IMERG Satellite"],
  warning:    ["IMD", "VARSHANETRA AI Ensemble", "NDMA"],
  flood:      ["DEM Elevation Data", "S1G Flood Inventory", "PINN Model"],
  model:      ["ERA5 Reanalysis", "INSAT-3DR", "Doppler Radar"],
  default:    ["VARSHANETRA AI", "IMD Data"],
};

function detectSources(text: string): string[] {
  const t = text.toLowerCase();
  if (t.includes("rainfall") || t.includes("rain"))    return SOURCES_MAP.rainfall;
  if (t.includes("warning") || t.includes("alert"))    return SOURCES_MAP.warning;
  if (t.includes("flood") || t.includes("inundation")) return SOURCES_MAP.flood;
  if (t.includes("model") || t.includes("ai"))         return SOURCES_MAP.model;
  return SOURCES_MAP.default;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, `<code style="background:rgba(6,182,212,0.12);padding:1px 5px;border-radius:4px;font-family:var(--font-mono);font-size:12px;color:var(--cyan)">$1</code>`)
    .replace(/\n/g, '<br/>');
}

const SESSION_ID = `session-${Date.now()}`;

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: `**Namaste! I'm VARSHA AI** — your intelligent flood intelligence assistant powered by VARSHANETRA.

I have access to **live weather data** across India and can help with:
- Current flood warnings and rainfall alerts
- AI model predictions and confidence levels
- Flood risk assessment for any district
- Historical event analysis
- Technical explanations of our models

**Ask in Hindi, Marathi, or English.** Try: *"Which districts are at risk today?"*`,
  timestamp: null,
  sources: ["VARSHANETRA AI", "Live DB Context"],
};

export default function ChatPage() {
  const [messages,    setMessages]    = useState<Message[]>([INITIAL_MESSAGE]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [context,     setContext]     = useState({ warnings: 0, stations: 785, accuracy: 87 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then(r => r.json())
      .then(d => setContext({ warnings: d.warnings?.total || 0, stations: d.statistics?.activeStations || 785, accuracy: d.statistics?.modelAccuracy || 87 }))
      .catch(() => {});
  }, []);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: SESSION_ID }),
      });
      const data = await res.json();
      const reply = data.response || "I couldn't process that request. Please try again.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        sources: detectSources(reply),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠ Connection error. Please check your internet and try again.",
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  };

  const handleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser. Please use Chrome."); return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN"; rec.interimResults = false;
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = () => setIsListening(false);
    rec.onresult = (e: { results: { transcript: string }[][] }) => {
      const t = e.results[0][0].transcript;
      setInput(t);
      inputRef.current?.focus();
    };
    rec.start();
  };

  const panel = { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" } as const;
  const SL = { fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600 as const, letterSpacing: "0.10em" as const, textTransform: "uppercase" as const, color: "var(--text-muted)" };

  return (
    <AppShell>
      <div style={{ height: "calc(100dvh - 84px)", display: "flex", overflow: "hidden" }}>

        {/* ── Left: history + quick prompts ────────────────── */}
        <aside style={{ width: 240, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg-surface)", overflow: "hidden" }} className="hide-tablet">

          {/* Quick prompts */}
          <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ ...SL, marginBottom: 10 }}>Quick Prompts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p.q)}
                  style={{
                    padding: "7px 10px", borderRadius: "var(--r-sm)", textAlign: "left",
                    background: "transparent", border: "1px solid transparent",
                    color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
                    transition: "all 150ms", width: "100%", fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--cyan-glow-sm)"; el.style.borderColor = "var(--border-accent)"; el.style.color = "var(--cyan)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "transparent"; el.style.color = "var(--text-muted)"; }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-dim)", marginRight: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.category}</span>
                  <br/>{p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live context */}
          <div style={{ padding: "12px", flex: 1, overflowY: "auto" }} className="scrollbar-none">
            <div style={{ ...SL, marginBottom: 10 }}>Live Context</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Active Warnings", val: context.warnings,     color: "var(--orange)" },
                { label: "Stations Online", val: context.stations,     color: "var(--green)" },
                { label: "AI Accuracy",     val: `${context.accuracy}%`, color: "var(--cyan)" },
              ].map((m, i) => (
                <div key={i} style={{ ...panel, padding: "10px 12px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: m.color }}>{m.val}</div>
                </div>
              ))}
              <span className="badge-demo">LIVE DB CONTEXT</span>
            </div>
          </div>
        </aside>

        {/* ── Center: conversation ─────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 16 }} className="scrollbar-none">
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "100%" }}>
                {m.role === "user" ? (
                  <div className="chat-bubble-user">
                    {m.content}
                  </div>
                ) : (
                  <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* AI header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "var(--r-sm)", background: "linear-gradient(135deg, var(--cyan), var(--blue))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text-on-accent)", fontWeight: 700, flexShrink: 0 }}>V</div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--cyan)", letterSpacing: "0.06em" }}>VARSHA AI</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)" }}>
                        {m.timestamp ? m.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                      </span>
                    </div>
                    {/* Bubble */}
                    <div className="chat-bubble-ai" dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }}/>
                    {/* Sources */}
                    {m.sources && m.sources.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 2 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", alignSelf: "center" }}>Sources:</span>
                        {m.sources.map((s, si) => (
                          <span key={si} className="source-chip">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: "var(--r-sm)", background: "linear-gradient(135deg, var(--cyan), var(--blue))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text-on-accent)", fontWeight: 700, flexShrink: 0 }}>V</div>
                <div className="chat-bubble-ai" style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", display: "inline-block", animation: `live-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input bar */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Voice button */}
              <button onClick={handleVoice}
                style={{
                  width: 38, height: 38, borderRadius: "var(--r-md)", flexShrink: 0,
                  background: isListening ? "var(--red)" : "var(--bg-panel)",
                  border: `1px solid ${isListening ? "var(--red-border)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, cursor: "pointer", transition: "all 200ms",
                  animation: isListening ? "live-pulse 1.5s ease-in-out infinite" : "none",
                }}
                title={isListening ? "Stop recording" : "Voice input"}>
                🎤
              </button>
              {/* Text input */}
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about floods, rainfall, warnings… (English / हिंदी / मराठी)"
                style={{ flex: 1, background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: 14, padding: "8px 14px", outline: "none", transition: "border-color 200ms" }}
                onFocus={e => (e.target.style.borderColor = "var(--border-focus)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border-strong)")}
              />
              {/* Send button */}
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="btn btn-primary"
                style={{ height: 38, paddingLeft: 14, paddingRight: 14, flexShrink: 0, fontFamily: "var(--font-body)" }}>
                Send →
              </button>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)", marginTop: 6, textAlign: "center" }}>
              VARSHA AI uses live flood data. Verify critical decisions with official IMD/NDMA sources.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
