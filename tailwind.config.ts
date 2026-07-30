import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0B0C10",
          surface: "#15171D",
          raised: "#1E212A",
          border: "#2D313C",
        },
        ink: {
          DEFAULT: "#F5F5F7",
          muted: "#9CA0AC",
          faint: "#6B6F7B",
        },
        brand: {
          DEFAULT: "rgb(var(--color-brand) / <alpha-value>)",
          soft: "#FF5A4D",
          dim: "#4A0D0A",
        },
        mint: {
          DEFAULT: "#35E7C6",
          dim: "#0E4A40",
        },
        warn: {
          DEFAULT: "#FFB84D",
          dim: "#4A3410",
        },
        danger: {
          DEFAULT: "#FF5C5C",
          dim: "#4A1414",
        },
        rarity: {
          comum: "#8A93A6",
          rara: "#4D9CFF",
          epica: "#B562FF",
          lendaria: "#FFB84D",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        scanlines:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
        circuits:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cg fill='none' stroke='%23F2231E' stroke-opacity='0.08' stroke-width='1.5'%3E%3Cpath d='M10 10h60v40h40v60h-40M110 10v50h60v70h-60v60M10 110h50v80M170 170h40'/%3E%3Ccircle cx='10' cy='10' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='70' cy='50' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='110' cy='60' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='170' cy='130' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='170' cy='170' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='60' cy='190' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3C/g%3E%3C/svg%3E\")",
        hud: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cg fill='none' stroke='%23F2231E' stroke-opacity='0.08' stroke-width='1.5'%3E%3Cpath d='M10 10h60v40h40v60h-40M110 10v50h60v70h-60v60M10 110h50v80M170 170h40'/%3E%3Ccircle cx='10' cy='10' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='70' cy='50' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='110' cy='60' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='170' cy='130' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='170' cy='170' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3Ccircle cx='60' cy='190' r='3' fill='%23F2231E' fill-opacity='0.12' stroke='none'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--color-brand) / 0.25), 0 0 24px rgb(var(--color-brand) / 0.15)",
        "glow-mint": "0 0 0 1px rgba(53,231,198,0.25), 0 0 24px rgba(53,231,198,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
