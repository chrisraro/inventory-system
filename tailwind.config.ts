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
          DEFAULT: "#8B4513", // Saddle Brown - matches logo
          50: "#FDF6F0",
          100: "#F9E6D3",
          200: "#F2CCA7",
          300: "#E8A870",
          400: "#D4813A",
          500: "#C4621A",
          600: "#B54E15",
          700: "#963D15",
          800: "#7A3318",
          900: "#652B16",
          950: "#371408",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#D2691E", // Chocolate - complementary to primary
          50: "#FEF7F0",
          100: "#FDEBD8",
          200: "#FAD4B1",
          300: "#F6B680",
          400: "#F0914D",
          500: "#EA7527",
          600: "#DB5F1D",
          700: "#B64B1B",
          800: "#913D1E",
          900: "#75331C",
          950: "#3F180C",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "#CD853F", // Peru - warm accent
          50: "#FDF8F3",
          100: "#FAEDE0",
          200: "#F4D8C0",
          300: "#ECBC95",
          400: "#E19968",
          500: "#D87D47",
          600: "#CA653C",
          700: "#A85034",
          800: "#874132",
          900: "#6E372C",
          950: "#3B1C16",
          foreground: "hsl(var(--accent-foreground))",
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
        // Brand colors from logo
        brand: {
          brown: "#8B4513",
          chocolate: "#D2691E",
          peru: "#CD853F",
          tan: "#D2B48C",
          cream: "#F5F5DC",
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
