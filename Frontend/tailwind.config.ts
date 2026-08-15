import type { Config } from "tailwindcss";

/**
 * Obuya Grassroots Foundation  — Tailwind v4 reference config.
 *
 * Tailwind v4 reads design tokens from `app/globals.css` via `@theme`.
 * This file is retained for tooling that expects a `tailwind.config.ts`
 * (IDE plugins, codegen, etc.) and mirrors the same brand palette.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#0c7d4d",
          600: "#076139",
          700: "#055530",
          800: "#04432a",
          900: "#022c19",
          950: "#011a0f",
        },
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        cream: {
          50: "#fdfcf8",
          100: "#faf7f0",
          200: "#f3ede0",
          300: "#e8dfca",
          400: "#d4c5a2",
        },
        "rose-gold": {
          50:  "#fdf2f3",
          100: "#f9e5e7",
          200: "#f2ccd0",
          300: "#e8adb4",
          400: "#d88a94",
          500: "#c46470",
          600: "#a85060",
          700: "#8a3d4a",
          800: "#6b2d38",
          900: "#4a1e26",
          950: "#2d1016",
        },
        teal: {
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        white: "#E8F5E9",
        surface: {
          DEFAULT: "#E8F5E9",
          raised: "#E8F5E9",
          sunken: "#fdfcf8",
          muted: "#faf7f0",
          inverse: "#022c19",
        },
        success: { 50: "#ecfdf5", 500: "#10b981", 700: "#047857" },
        warning: { 50: "#fffbeb", 500: "#f59e0b", 700: "#b45309" },
        danger: { 50: "#fef2f2", 500: "#ef4444", 700: "#b91c1c" },
        info: { 50: "#eff6ff", 500: "#3b82f6", 700: "#1d4ed8" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-bricolage)", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
