import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Material You colors (Legacy - preserved for compatibility until Phase 2)
        "error-container": "#ffdad6",
        "surface-dim": "#edd5cb",
        "on-tertiary-container": "#33322f",
        "on-background": "#251913",
        background: "#fff8f6",
        "tertiary-fixed-dim": "#c9c6c1",
        "on-error": "#ffffff",
        primary: "#9d4300",
        "on-error-container": "#93000a",
        "on-secondary-container": "#686361",
        "surface-container": "#ffeae0",
        "surface-bright": "#fff8f6",
        "surface-container-low": "#fff1eb",
        "surface-container-lowest": "#ffffff",
        error: "#ba1a1a",
        "inverse-surface": "#3c2d26",
        "on-primary-container": "#582200",
        "secondary-fixed-dim": "#ccc5c2",
        "on-surface-variant": "#584237",
        "on-tertiary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-secondary-fixed-variant": "#4a4643",
        surface: "#fff8f6",
        "surface-tint": "#9d4300",
        "on-surface": "#251913",
        "tertiary-container": "#9d9a95",
        "primary-fixed-dim": "#ffb690",
        "on-secondary-fixed": "#1e1b19",
        "inverse-on-surface": "#ffede6",
        "secondary-container": "#e9e1dd",
        secondary: "#625d5b",
        "on-primary": "#ffffff",
        "surface-variant": "#f6ded3",
        "tertiary-fixed": "#e6e2dc",
        "primary-container": "#f97316",
        "primary-fixed": "#ffdbca",
        "surface-container-highest": "#f6ded3",
        "on-primary-fixed-variant": "#783200",
        "inverse-primary": "#ffb690",
        outline: "#8c7164",
        "surface-container-high": "#fce3d9",
        "on-tertiary-fixed-variant": "#484743",
        tertiary: "#605e5a",
        "on-tertiary-fixed": "#1c1c18",
        "outline-variant": "#e0c0b1",
        "secondary-fixed": "#e9e1dd",
        "on-primary-fixed": "#341100",

        // New Semantic Tokens (Premium UI)
        brand: {
          50: '#fef7ed',
          100: '#fcedd4',
          200: '#f9d6a3',
          300: '#f5b967',
          400: '#ef952f',
          500: '#ea750f', // Core primary (warm amber/orange)
          600: '#dc590a',
          700: '#b7400b',
          800: '#913210',
          900: '#752a10',
          950: '#3f1106',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        semantic_success: {
          400: '#4ade80',
          500: '#22c55e',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        semantic_error: {
          50: '#fef2f2',
          100: '#fee2e2',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Dark-mode semantic surfaces (app uses color-scheme: dark globally)
        'surface-base': '#09090b',    // zinc-950 — deepest background
        'surface-raised': '#18181b',  // zinc-900 — cards, sidebars, containers
        'surface-overlay': '#27272a', // zinc-800 — elevated overlays, dropdowns
        'border-default': '#27272a',  // zinc-800 — standard borders
        'border-strong': '#3f3f46',   // zinc-700 — emphasized borders
        'border-hover': '#52525b',    // zinc-600 — border on hover
        'text-primary': '#fafafa',    // zinc-50  — high-contrast primary text
        'text-secondary': '#d4d4d8',  // zinc-300 — secondary text
        'text-tertiary': '#a1a1aa',   // zinc-400 — muted/tertiary text
        'text-disabled': '#52525b',   // zinc-600 — disabled text
        'text-inverse': '#09090b',    // zinc-950 — text on light/brand bg

        status: {
          pending: '#f59e0b',
          accepted: '#3b82f6',
          preparing: '#ea750f',
          ready: '#22c55e',
          delivered: '#94a3b8',
          cancelled: '#ef4444'
        },
        accent: {
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        semantic_info: {
          400: '#60a5fa',
          500: '#3b82f6',
        },
        border: {
          default: '#27272a',
          primary: '#27272a',
          secondary: '#3f3f46',
          strong: '#3f3f46',
          hover: '#52525b',
        },
        text: {
          primary: '#fafafa',
          secondary: '#d4d4d8',
          tertiary: '#a1a1aa',
          muted: '#71717a',
          disabled: '#52525b',
          inverse: '#09090b',
        },
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        full: '9999px',
      },
      spacing: {
        "margin-desktop": "32px",
        "margin-mobile": "16px",
        "touch-min": "44px",
        gutter: "16px",
        xs: "4px",
        sm: "8px",
        base: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        "4.5": "1.125rem",
      },
      fontFamily: {
        // Legacy
        "label-sm": ["Inter", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-sm": ["Plus Jakarta Sans", "Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "display-lg-mobile": ["Plus Jakarta Sans", "Inter", "sans-serif"],
        // New Premium
        sans: ["Inter", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        // New semantic sizes
        'display-2xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-lg-mobile': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-md': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'headline-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '700' }],
        'headline-md': ['1.375rem', { lineHeight: '1.35', fontWeight: '700' }],
        'body-xl': ['1.125rem', { lineHeight: '1.75' }],
        'body-lg': ['1rem', { lineHeight: '1.75' }],
        'body-md': ['0.875rem', { lineHeight: '1.6' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
        'label-lg': ['0.875rem', { lineHeight: '1.25', fontWeight: '500', letterSpacing: '0.01em' }],
        'label-md': ['0.8125rem', { lineHeight: '1.25', fontWeight: '500', letterSpacing: '0.01em' }],
        'label-sm': ['0.75rem', { lineHeight: '1.25', fontWeight: '500', letterSpacing: '0.02em' }],
        'label-xs': ['0.6875rem', { lineHeight: '1.25', fontWeight: '500', letterSpacing: '0.02em' }],
        'display-xs': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'mono': ['0.875rem', { lineHeight: '1.6' }],
      },
      boxShadow: {
        // Legacy
        glow: "0 0 0 1px rgba(251, 191, 36, 0.12), 0 24px 80px rgba(0, 0, 0, 0.35)",
        stitch: "0 2px 12px -2px rgba(28, 25, 23, 0.08)",
        "login-card": "0 12px 24px -4px rgba(28, 25, 23, 0.12)",
        // New Premium
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        highlight: '0 0 0 3px rgb(var(--color-brand-500) / 0.15)',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateY(-0.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(0.75rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "toast-slide": {
          from: { opacity: "0", transform: "translateY(-0.75rem) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "zoom-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s ease infinite",
        "fade-in": "fade-in 180ms ease-out both",
        "slide-in": "slide-in 220ms ease-out both",
        "slide-up": "slide-up 240ms ease-out both",
        "toast-slide": "toast-slide 240ms ease-out both",
        in: "fade-in 180ms ease-out both",
      },
      zIndex: {
        45: '45',
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".fade-in": {
          animation: "fade-in 180ms ease-out both",
        },
        ".zoom-in": {
          animation: "zoom-in 180ms ease-out both",
        },
      });
    }),
  ],
};

export default config;
