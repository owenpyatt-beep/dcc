/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        chassis: "#e0e5ec",
        panel: "#f0f2f5",
        recessed: "#d1d9e6",
        ink: "#2d3436",
        label: "#4a5568",
        accent: "#ff4757",
        "accent-fg": "#ffffff",
        shadow: "#babecc",
        highlight: "#ffffff",
        "shadow-dark": "#a3b1c6",
        "led-green": "#22c55e",
        "led-amber": "#f59e0b",
        "led-red": "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "8px 8px 16px #babecc, -8px -8px 16px #ffffff",
        floating:
          "12px 12px 24px #babecc, -12px -12px 24px #ffffff, inset 1px 1px 0 rgba(255,255,255,0.5)",
        pressed: "inset 6px 6px 12px #babecc, inset -6px -6px 12px #ffffff",
        recessed: "inset 4px 4px 8px #babecc, inset -4px -4px 8px #ffffff",
        "recessed-sm": "inset 3px 3px 6px #babecc, inset -3px -3px 6px #ffffff",
        sharp:
          "4px 4px 8px rgba(0,0,0,0.15), -1px -1px 1px rgba(255,255,255,0.8)",
        "led-red": "0 0 10px 2px rgba(255, 71, 87, 0.6)",
        "led-green": "0 0 10px 2px rgba(34, 197, 94, 0.6)",
        "accent-button":
          "4px 4px 8px rgba(166,50,60,0.4), -4px -4px 8px rgba(255,100,110,0.4)",
      },
      transitionTimingFunction: {
        mechanical: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        "led-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "led-pulse": "led-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
