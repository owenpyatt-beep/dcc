import React from "react";
import { Stamp, Numeric } from "./Typography";
import { LED } from "./LED";

// A stat readout — label on top, big monospace number below.
// Optional `ledColor` (green/amber/red) adds a status light next to the value.
// Optional `delta` shows a secondary metric (e.g. "+$12K MoM").
export function StatTile({
  label,
  value,
  unit = "",
  ledColor,
  delta,
  deltaColor = "text-label",
  className = "",
  children,
}) {
  return (
    <div
      className={
        "relative rounded-2xl bg-chassis p-5 shadow-card overflow-hidden " +
        className
      }
    >
      <div className="flex items-center justify-between mb-3">
        <Stamp>{label}</Stamp>
        {ledColor && <LED color={ledColor} size={8} pulse />}
      </div>
      <div className="flex items-baseline gap-1">
        <Numeric className="text-2xl md:text-3xl font-bold text-ink emboss">
          {value}
        </Numeric>
        {unit && (
          <span className="text-xs font-mono font-semibold text-label">
            {unit}
          </span>
        )}
      </div>
      {delta && (
        <Numeric className={"mt-1.5 text-[11px] " + deltaColor}>
          {delta}
        </Numeric>
      )}
      {children}
    </div>
  );
}
