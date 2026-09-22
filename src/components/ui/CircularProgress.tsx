"use client";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  label,
  showValue = true,
  className = "",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  const color =
    value >= 80 ? "#10b981" :
    value >= 65 ? "#0284c7" :
    value >= 50 ? "#f59e0b" :
    "#ef4444";

  return (
    <div className={`relative inline-flex flex-col items-center gap-1 ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s ease",
              filter: `drop-shadow(0 2px 4px ${color}40)`,
            }}
          />
        </svg>
        {showValue && (
          <span
            className="absolute font-bold text-center"
            style={{
              fontSize: size * 0.22,
              color,
            }}
          >
            {Math.round(value)}%
          </span>
        )}
      </div>
      {label && <p className="text-xs text-gray-400 text-center">{label}</p>}
    </div>
  );
}
