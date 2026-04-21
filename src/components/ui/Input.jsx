import React, { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={
        "w-full rounded-lg bg-chassis px-5 py-3.5 text-sm font-mono text-ink " +
        "placeholder:text-label placeholder:opacity-60 " +
        "shadow-recessed border-none outline-none transition-shadow " +
        "focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_var(--accent)] " +
        className
      }
      {...rest}
    />
  );
});

export const Select = forwardRef(function Select(
  { className = "", children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={
        "w-full rounded-lg bg-chassis px-5 py-3.5 text-sm font-mono text-ink " +
        "shadow-recessed border-none outline-none appearance-none cursor-pointer " +
        "transition-shadow " +
        "focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_var(--accent)] " +
        className
      }
      {...rest}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea(
  { className = "", ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={
        "w-full rounded-lg bg-chassis px-5 py-3.5 text-sm font-mono text-ink " +
        "placeholder:text-label placeholder:opacity-60 " +
        "shadow-recessed border-none outline-none resize-y transition-shadow " +
        "focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_var(--accent)] " +
        className
      }
      {...rest}
    />
  );
});

export function Label({ children, className = "" }) {
  return (
    <div
      className={
        "mb-2 text-[10px] font-bold uppercase tracking-[0.12em] font-mono text-label " +
        className
      }
    >
      {children}
    </div>
  );
}
