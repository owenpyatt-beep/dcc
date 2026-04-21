import React from "react";
import { T, DRAW_STATUS } from "../data/jobs";

export const fc = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const pct = (a, b) => Math.round((a / b) * 100);

export const short = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${(n / 1_000).toFixed(0)}K`;

export const Mono = ({ children, style = {}, className = "" }) => (
  <span className={"font-mono tabular-nums " + className} style={style}>
    {children}
  </span>
);

// Draw/status key → LED color (for the new palette).
// Keeps DRAW_STATUS colors working in Recharts, while badges switch to LEDs.
const STATUS_LED = {
  compiling: "amber",
  in_review: "blue",
  submitted: "purple",
  funded: "green",
};

const LED_FILL = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  accent: "#ff4757",
  purple: "#8b5cf6",
};
const LED_GLOW = {
  green: "rgba(34,197,94,0.65)",
  amber: "rgba(245,158,11,0.6)",
  red: "rgba(239,68,68,0.6)",
  blue: "rgba(59,130,246,0.6)",
  accent: "rgba(255,71,87,0.6)",
  purple: "rgba(139,92,246,0.6)",
};

// Small LED dot (static, no pulse — for inline use in lists/tables).
const InlineDot = ({ color = "green", size = 8 }) => {
  const fill = LED_FILL[color] || color;
  const glow = LED_GLOW[color] || "rgba(0,0,0,0.25)";
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "9999px",
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0%, ${fill} 55%, ${fill} 100%)`,
        boxShadow: `0 0 ${Math.round(size)}px ${Math.round(
          size * 0.2
        )}px ${glow}, inset 0 0 2px rgba(0,0,0,0.3)`,
      }}
    />
  );
};

// Stamped metadata pill — recessed chassis slot with optional LED.
export const Badge = ({ label, color, bg, ledColor }) => {
  // Infer a complementary LED color from the legacy color prop if not given
  const led =
    ledColor ||
    (color === T.green
      ? "green"
      : color === T.amber
      ? "amber"
      : color === T.red
      ? "red"
      : color === T.blue
      ? "blue"
      : null);

  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-chassis px-2.5 py-1 shadow-recessed-sm whitespace-nowrap">
      {led && <InlineDot color={led} size={7} />}
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-label">
        {label}
      </span>
    </span>
  );
};

// Compact status chip for draw states — LED + label
export const StatusDot = ({ status }) => {
  const s = DRAW_STATUS[status];
  const led = STATUS_LED[status] || "amber";
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <InlineDot color={led} size={7} />
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-label">
        {s.label}
      </span>
    </span>
  );
};

// Recessed channel + orange/green/etc gradient fill
export const ProgressBar = ({ value, max, color, height = 6 }) => {
  const p = Math.min(100, pct(value, max));
  // Map legacy colors to the new palette
  const fill =
    color === T.gold || !color
      ? "linear-gradient(90deg, #ff4757, #c1323e)"
      : color === T.green
      ? "linear-gradient(90deg, #22c55e, #15803d)"
      : color === T.amber
      ? "linear-gradient(90deg, #f59e0b, #b45309)"
      : color === T.red
      ? "linear-gradient(90deg, #ef4444, #991b1b)"
      : color === T.blue
      ? "linear-gradient(90deg, #3b82f6, #1e40af)"
      : `linear-gradient(90deg, ${color}, ${color})`;
  return (
    <div
      style={{
        height,
        borderRadius: 9999,
        background: "var(--chassis)",
        boxShadow:
          "inset 2px 2px 4px rgba(186,190,204,0.9), inset -2px -2px 4px rgba(255,255,255,0.9)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${p}%`,
          borderRadius: 9999,
          background: fill,
          transition: "width 0.8s cubic-bezier(0.175,0.885,0.32,1.275)",
          boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
};

// Stat card — panel with stamp label, big mono value, optional LED accent
export const KpiCard = ({ label, value, sub, accent = T.gold, delta }) => {
  // Map legacy accent colors to LED color names
  const ledColor =
    accent === T.green
      ? "green"
      : accent === T.amber
      ? "amber"
      : accent === T.red
      ? "red"
      : accent === T.blue
      ? "blue"
      : "accent";

  return (
    <div className="relative rounded-2xl bg-chassis p-5 shadow-card overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-label">
          {label}
        </span>
        <InlineDot color={ledColor} size={8} />
      </div>
      <div className="font-mono tabular-nums text-2xl md:text-[28px] font-bold text-ink emboss leading-none">
        {value}
      </div>
      {sub && (
        <div className="mt-2 text-[11px] font-mono text-label">{sub}</div>
      )}
      {delta !== undefined && delta !== null && (
        <div
          className={
            "mt-2 font-mono text-[11px] " +
            (delta > 0 ? "text-[#22c55e]" : "text-[#ef4444]")
          }
        >
          {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last draw
        </div>
      )}
    </div>
  );
};

// Recharts tooltip — floating neumorphic panel
export const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-chassis px-4 py-3 shadow-floating min-w-[140px]">
      <div className="text-[11px] font-bold text-ink mb-1.5">{label}</div>
      {payload.map((p, i) => (
        <div
          key={i}
          className="flex justify-between gap-3 text-[11px] font-mono tabular-nums"
          style={{ color: p.color }}
        >
          <span className="font-semibold">{p.name}</span>
          <span>{typeof p.value === "number" ? fc(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const COLORS = [
  "#ff4757", // accent
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#64748b", // slate
];
