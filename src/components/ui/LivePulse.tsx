"use client";
import { cn } from "@/lib/utils";

interface LivePulseProps {
  label: string;
  status?: string;
  color?: "green" | "cyan" | "red" | "orange" | "purple";
  size?: "sm" | "md";
}

const COLORS = {
  green:  { dot: "bg-emerald-500", ring: "bg-emerald-500", text: "text-emerald-700" },
  cyan:   { dot: "bg-sky-500",  ring: "bg-sky-500",  text: "text-sky-700"  },
  red:    { dot: "bg-red-500",   ring: "bg-red-500",   text: "text-red-700"   },
  orange: { dot: "bg-orange-500",ring: "bg-orange-500",text: "text-orange-700"},
  purple: { dot: "bg-purple-500",ring: "bg-purple-500",text: "text-purple-700"},
};

export function LivePulse({ label, status, color = "green", size = "md" }: LivePulseProps) {
  const c = COLORS[color];
  const sz = size === "sm" ? "px-2.5 py-1 text-xs gap-1.5" : "px-3.5 py-1.5 text-sm gap-2";

  return (
    <div className={cn("flex items-center bg-slate-50 rounded-full border border-slate-200", sz)}>
      <div className="relative flex-shrink-0">
        <div className={cn("rounded-full", size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2", c.dot)} />
        <div className={cn("absolute inset-0 rounded-full animate-ping opacity-60", c.ring)} />
      </div>
      {label && <span className="text-slate-700 font-medium">{label}</span>}
      {status && <span className={cn("text-[10px] font-bold uppercase tracking-wider", c.text)}>{status}</span>}
    </div>
  );
}
