import type { Config } from "tailwindcss";

export default {
  darkMode: "class",

  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        fx: {
          bg: "#020817",
          panel: "#0b162d",
          card: "#091424",
          border: "#123052",
          blue: "#0a84ff",
          text: "#e5edf7",
          muted: "#8fa3bd",
          success: "#22c55e",
          danger: "#ef4444",
          warning: "#facc15",
        },
      },

      boxShadow: {
        panel: "0 18px 60px rgba(0,0,0,0.28)",
        glow: "0 0 24px rgba(10,132,255,0.18)",
      },

      borderRadius: {
        panel: "26px",
      },
    },
  },

  plugins: [],
} satisfies Config;