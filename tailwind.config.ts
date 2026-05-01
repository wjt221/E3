import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#dce7ff",
          200: "#b9d0ff",
          300: "#84aeff",
          400: "#4d82ff",
          500: "#1a56ff",
          600: "#0035f5",
          700: "#0029d9",
          800: "#0024b0",
          900: "#00208b",
          950: "#001260",
        },
        surface: {
          0:  "rgb(10 14 26)",
          1:  "rgb(14 20 38)",
          2:  "rgb(20 28 52)",
          3:  "rgb(28 38 68)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        "glow-blue":  "0 0 20px rgb(26 86 255 / 0.15), 0 0 40px rgb(26 86 255 / 0.08)",
        "glow-sm":    "0 0 12px rgb(26 86 255 / 0.12)",
        "card":       "0 1px 3px rgb(0 0 0 / 0.4), 0 1px 2px rgb(0 0 0 / 0.3)",
        "card-lg":    "0 4px 24px rgb(0 0 0 / 0.5), 0 1px 4px rgb(0 0 0 / 0.3)",
        "inset-top":  "inset 0 1px 0 rgb(255 255 255 / 0.04)",
      },
      backgroundImage: {
        "gradient-radial":   "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand":    "linear-gradient(135deg, #1a56ff, #4d82ff)",
        "mesh-dark": `
          radial-gradient(ellipse 80% 50% at 20% 40%, rgb(26 86 255 / 0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 60%, rgb(77 130 255 / 0.05) 0%, transparent 60%)
        `,
      },
      animation: {
        "fade-in":    "animate-in 0.2s ease-out",
        "slide-up":   "animate-up 0.25s ease-out",
        "scale-in":   "animate-scale 0.2s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow":  "spin 2s linear infinite",
      },
      keyframes: {
        "animate-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "animate-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "animate-scale": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
