import React from "react";

// Small uppercase metadata — "SYSTEM OPERATIONAL", "STATUS", etc.
export function Stamp({ children, className = "", as: Tag = "span" }) {
  return (
    <Tag
      className={
        "font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-label " +
        className
      }
    >
      {children}
    </Tag>
  );
}

// Numeric display — for dollar amounts, counts, percentages. Always monospace.
export function Numeric({ children, className = "", as: Tag = "span" }) {
  return (
    <Tag className={"font-mono tabular-nums " + className}>{children}</Tag>
  );
}

// Headline — Inter, heavy, with subtle emboss
export function Heading({
  level = 2,
  children,
  className = "",
}) {
  const Tag = `h${level}`;
  const size =
    level === 1
      ? "text-4xl md:text-5xl font-extrabold tracking-tight"
      : level === 2
      ? "text-2xl md:text-3xl font-bold tracking-tight"
      : level === 3
      ? "text-lg md:text-xl font-bold tracking-tight"
      : "text-base font-bold";
  return React.createElement(
    Tag,
    {
      className: `${size} text-ink emboss ${className}`,
    },
    children
  );
}
