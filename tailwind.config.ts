import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "rgb(113, 182, 170)", // New primary color
          50: "#f0f9f8",
          100: "#d9f0ee",
          200: "#b3e1dd",
          300: "#8dd2cc",
          400: "#67c3bb",
          500: "rgb(113, 182, 170)", // 500 matches DEFAULT
          600: "#459a8f",
          700: "#34756b",
          800: "#235048",
          900: "#112b25",
          950: "#0a1a16",
          foreground: "rgb(9, 78, 87)", // New primary-foreground color
        },
        secondary: {
          DEFAULT: "rgb(9, 78, 87)", // New secondary color
          50: "#e6f0f1",
          100: "#cde1e2",
          200: "#9bc3c6",
          300: "#69a5aa",
          400: "#37878e",
          500: "rgb(9, 78, 87)", // 500 matches DEFAULT
          600: "#074f58",
          700: "#053b42",
          800: "#04272c",
          900: "#021316",
          950: "#010c0f",
          foreground: "#ffffff", // White foreground for dark secondary
        },
        accent: {
          DEFAULT: "#ffffff", // White as accent
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
          foreground: "rgb(9, 78, 87)", // Dark foreground for light accent
        },
        destructive: {
          DEFAULT: "#DC2626", // Red for alerts
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand colors using new palette
        brand: {
          primary: "rgb(113, 182, 170)",
          secondary: "rgb(9, 78, 87)",
          white: "#ffffff",
        },
        // Material Design 3 surface colors
        surface: {
          DEFAULT: "hsl(var(--surface))",
          variant: "hsl(var(--surface-variant))",
          container: "hsl(var(--surface-container))",
          "container-low": "hsl(var(--surface-container-low))",
          "container-high": "hsl(var(--surface-container-high))",
          "container-highest": "hsl(var(--surface-container-highest))",
        },
        outline: {
          DEFAULT: "hsl(var(--outline))",
          variant: "hsl(var(--outline-variant))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Material Design 3 radius tokens
        xs: "4px",
        s: "8px",
        m: "12px",
        l: "16px",
        xl: "28px",
      },
      spacing: {
        // Material Design 3 spacing tokens
        xs: "4px",
        s: "8px",
        m: "16px",
        l: "24px",
        xl: "32px",
        xxl: "48px",
      },
      fontSize: {
        // Material Design 3 typography scale
        "display-large": ["57px", { lineHeight: "64px", fontWeight: "400" }],
        "display-medium": ["45px", { lineHeight: "52px", fontWeight: "400" }],
        "display-small": ["36px", { lineHeight: "44px", fontWeight: "400" }],
        "headline-large": ["32px", { lineHeight: "40px", fontWeight: "400" }],
        "headline-medium": ["28px", { lineHeight: "36px", fontWeight: "400" }],
        "headline-small": ["24px", { lineHeight: "32px", fontWeight: "400" }],
        "title-large": ["22px", { lineHeight: "28px", fontWeight: "500" }],
        "title-medium": ["16px", { lineHeight: "24px", fontWeight: "500" }],
        "title-small": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "label-large": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "label-medium": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "label-small": ["11px", { lineHeight: "16px", fontWeight: "500" }],
        "body-large": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-medium": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-small": ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
      boxShadow: {
        // Material Design 3 elevation shadows
        "elevation-1": "0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
        "elevation-2": "0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)",
        "elevation-3": "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)",
        "elevation-4": "0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)",
        "elevation-5": "0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Material Design 3 motion tokens
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      screens: {
        xs: "375px", // iPhone SE and similar
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
        // iOS specific breakpoints
        "ios-sm": "390px", // iPhone 12/13/14
        "ios-md": "428px", // iPhone 12/13/14 Pro Max
        "ios-lg": "768px", // iPad
        "ios-xl": "1024px", // iPad Pro
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
