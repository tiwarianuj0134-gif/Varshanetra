"use client";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: "cyan" | "red" | "orange" | "green" | "purple" | "none";
  style?: React.CSSProperties;
  as?: "div" | "section" | "article";
}

export function GlassCard({
  children, className = "", onClick, hover = false,
  glow = "none", style, as: Tag = "div",
}: GlassCardProps) {
  const glowMap: Record<string, string> = {
    cyan:   "shadow-cyan-500/10",
    red:    "shadow-red-500/10",
    orange: "shadow-orange-500/10",
    green:  "shadow-emerald-500/10",
    purple: "shadow-purple-500/10",
    none:   "",
  };

  return (
    <Tag
      className={`rounded-2xl ${glowMap[glow]} ${hover ? "transition-all duration-300 cursor-pointer hover:-translate-y-0.5" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
