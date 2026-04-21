import React from "react";

export function Panel({
  children,
  className = "",
  screws = false,
  vents = false,
  elevated = false,
  recessed = false,
  flat = false,
  as: Tag = "div",
  ...rest
}) {
  let shadow = "shadow-card";
  if (recessed) shadow = "shadow-recessed";
  else if (elevated) shadow = "shadow-floating";
  else if (flat) shadow = "";

  const base =
    "relative rounded-2xl bg-chassis " +
    shadow +
    (screws ? " screws" : "");

  return (
    <Tag className={`${base} ${className}`} {...rest}>
      {vents && <Vents />}
      {children}
    </Tag>
  );
}

export function Vents({ className = "" }) {
  return (
    <div
      className={`pointer-events-none absolute top-3 right-4 flex gap-[3px] ${className}`}
      aria-hidden
    >
      <span className="block h-5 w-[2px] rounded-full bg-recessed shadow-[inset_1px_1px_2px_rgba(0,0,0,0.25)]" />
      <span className="block h-5 w-[2px] rounded-full bg-recessed shadow-[inset_1px_1px_2px_rgba(0,0,0,0.25)]" />
      <span className="block h-5 w-[2px] rounded-full bg-recessed shadow-[inset_1px_1px_2px_rgba(0,0,0,0.25)]" />
    </div>
  );
}
