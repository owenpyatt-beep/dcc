import React from "react";

// Variants:
//   primary — safety-orange accent button (main CTA)
//   secondary — chassis-matched button with neumorphic lift
//   ghost — flat label, muted until hover
//
// All variants include mechanical press physics: translate-y on active + shadow flip.
export function Button({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  iconLeft = null,
  iconRight = null,
  type = "button",
  ...rest
}) {
  const sizeCls =
    size === "sm"
      ? "h-9 px-4 text-[11px]"
      : size === "lg"
      ? "h-14 px-8 text-sm"
      : "h-12 px-6 text-xs";

  let variantCls = "";
  if (variant === "primary") {
    variantCls =
      "bg-accent text-white border border-white/20 shadow-accent-button " +
      "hover:brightness-110 active:shadow-pressed active:translate-y-[2px]";
  } else if (variant === "ghost") {
    variantCls =
      "bg-transparent text-label hover:text-ink hover:shadow-recessed-sm";
  } else {
    variantCls =
      "bg-chassis text-ink shadow-card " +
      "hover:text-accent active:shadow-pressed active:translate-y-[2px]";
  }

  return (
    <button
      type={type}
      className={
        "press inline-flex items-center justify-center gap-2 rounded-xl font-bold uppercase " +
        "tracking-[0.08em] font-mono select-none " +
        sizeCls +
        " " +
        variantCls +
        " " +
        className
      }
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
