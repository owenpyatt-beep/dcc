import React from "react";

// Hardware-style status light. Colors map to fixed LED tones.
// color: "green" | "amber" | "red" | "blue" | "accent" | a CSS color string
// size: pixel diameter (default 10)
const MAP = {
  green: { fill: "#22c55e", glow: "rgba(34, 197, 94, 0.65)" },
  amber: { fill: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)" },
  red: { fill: "#ef4444", glow: "rgba(239, 68, 68, 0.6)" },
  blue: { fill: "#3b82f6", glow: "rgba(59, 130, 246, 0.6)" },
  accent: { fill: "#ff4757", glow: "rgba(255, 71, 87, 0.6)" },
  purple: { fill: "#8b5cf6", glow: "rgba(139, 92, 246, 0.6)" },
  off: { fill: "#9ca3af", glow: "rgba(0,0,0,0)" },
};

export function LED({ color = "green", pulse = true, size = 10, className = "" }) {
  const { fill, glow } = MAP[color] || { fill: color, glow: "rgba(0,0,0,0.25)" };
  return (
    <span
      className={
        "inline-block rounded-full " +
        (pulse ? "animate-led-pulse " : "") +
        className
      }
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0%, ${fill} 55%, ${fill} 100%)`,
        boxShadow: `0 0 ${Math.round(size * 0.9)}px ${Math.round(
          size * 0.2
        )}px ${glow}, inset 0 0 2px rgba(0,0,0,0.3)`,
      }}
      aria-hidden
    />
  );
}

// LED + uppercase mono label, stacked inline
export function StatusPill({
  color = "green",
  label,
  className = "",
  pulse = true,
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-md bg-chassis px-2.5 py-1 shadow-recessed-sm " +
        className
      }
    >
      <LED color={color} size={8} pulse={pulse} />
      <span className="text-[9px] font-bold uppercase tracking-[0.12em] font-mono text-label">
        {label}
      </span>
    </span>
  );
}
