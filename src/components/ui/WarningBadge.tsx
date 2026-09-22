"use client";
import { cn } from "@/lib/utils";

interface WarningBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  pulse?: boolean;
}

const CONFIGS: Record<string, { bg: string; border: string; text: string; label: string; icon: string; shadow: string }> = {
  RED:    { bg:"bg-red-950/40",    border:"border-red-500/50",    text:"text-red-300",    label:"RED WARNING",   icon:"🔴", shadow:"shadow-md shadow-red-500/20"    },
  ORANGE: { bg:"bg-orange-950/40", border:"border-orange-500/50", text:"text-orange-300", label:"ORANGE ALERT",  icon:"🟠", shadow:"shadow-sm"                  },
  YELLOW: { bg:"bg-yellow-950/40", border:"border-yellow-500/50", text:"text-yellow-300", label:"YELLOW WATCH",  icon:"🟡", shadow:"shadow-sm"                  },
  GREEN:  { bg:"bg-emerald-950/40", border:"border-emerald-500/50", text:"text-emerald-300", label:"ALL CLEAR",     icon:"🟢", shadow:"shadow-sm"             },
};

export function WarningBadge({ level, size = "md", className, showIcon = true, pulse }: WarningBadgeProps) {
  const c = CONFIGS[level] ?? CONFIGS.GREEN;
  const sizeClass = { sm: "px-2 py-0.5 text-[10px] rounded-lg gap-1", md: "px-3 py-1.5 text-xs rounded-xl gap-1.5", lg: "px-4 py-2 text-sm rounded-xl font-bold gap-2" }[size];

  return (
    <span className={cn(
      "inline-flex items-center font-bold border uppercase tracking-wider",
      c.bg, c.border, c.text, c.shadow,
      (pulse || level === "RED") && "animate-pulse",
      sizeClass, className
    )}>
      {showIcon && <span className="text-[1em]">{c.icon}</span>}
      {c.label}
    </span>
  );
}
