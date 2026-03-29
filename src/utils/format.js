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

export const Mono = ({ children, style = {} }) => (
  <span
    style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      ...style,
    }}
  >
    {children}
  </span>
);

export const Badge = ({ label, color, bg }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: "3px 8px",
      borderRadius: 4,
      color,
      background: bg,
      border: `1px solid ${color}22`,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

export const StatusDot = ({ status }) => {
  const s = DRAW_STATUS[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.color,
          boxShadow: `0 0 6px ${s.color}`,
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: s.color,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {s.label}
      </span>
    </span>
  );
};

export const ProgressBar = ({ value, max, color = T.gold, height = 4 }) => {
  const p = Math.min(100, pct(value, max));
  return (
    <div
      style={{
        height,
        borderRadius: height / 2,
        background: T.bg4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${p}%`,
          borderRadius: height / 2,
          background: `linear-gradient(90deg, ${color}bb, ${color})`,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
};

export const KpiCard = ({ label, value, sub, accent = T.gold, delta }) => (
  <div
    style={{
      background: T.bg2,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}44, transparent)`,
      }}
    />
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: T.text2,
        marginBottom: 12,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 24,
        fontWeight: 700,
        color: accent,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: T.text2, marginTop: 8 }}>{sub}</div>
    )}
    {delta && (
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: delta > 0 ? T.green : T.red,
        }}
      >
        {delta > 0 ? "\u2191" : "\u2193"} {Math.abs(delta)}% vs last draw
      </div>
    )}
  </div>
);

export const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: T.bg3,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
      }}
    >
      <div style={{ color: T.text1, marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            color: p.color,
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <span>{p.name}</span>
          <Mono style={{ fontSize: 12 }}>
            {typeof p.value === "number" ? fc(p.value) : p.value}
          </Mono>
        </div>
      ))}
    </div>
  );
};

export const COLORS = [
  T.gold,
  T.blue,
  T.green,
  T.amber,
  "#a680d4",
  "#5fc8c8",
  "#c87a5f",
  "#9ac45f",
  "#c85f9a",
  T.text2,
];
