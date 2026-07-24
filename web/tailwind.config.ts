import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 暖白柔和配色
        paper: {
          50: "#faf9f5",   /* 主背景 米白 */
          100: "#f5f4ee",  /* 次背景 */
          200: "#ebe9e0",  /* 边框/分隔 */
          300: "#d4d2c5",  /* 弱边框 */
        },
        ink: {
          900: "#141413",  /* 主文字 深黑 */
          700: "#3a3a36",  /* 次文字 */
          500: "#6b6a63",  /* 弱文字 */
          400: "#9c9b91",  /* 占位 */
        },
        clay: {
          DEFAULT: "#d97757",  /* 主强调 暖橘 */
          light: "#e8a085",
          dark: "#c25e3d",
        },
        moss: {
          DEFAULT: "#788c5d",  /* 点缀 深绿 */
          light: "#9aa87f",
        },
        gold: {
          DEFAULT: "#d4a72c",  /* 配额低/警示 */
        },
        // shadcn CSS 变量映射
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 12px rgba(20, 20, 19, 0.06)",
        "soft-lg": "0 8px 32px rgba(20, 20, 19, 0.08)",
        glow: "0 0 24px rgba(217, 119, 87, 0.15)",
        card: "0 1px 3px rgba(20, 20, 19, 0.04), 0 1px 2px rgba(20, 20, 19, 0.03)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-right": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "draw-line": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-right": "slide-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-dot": "pulse-dot 1.2s ease-in-out infinite",
        "draw-line": "draw-line 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
