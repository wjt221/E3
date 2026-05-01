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
        // E3 brand palette — premium, trust-inspiring
        e3: {
          50: "#f0f4ff",
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
        slate: {
          850: "#172033",
          950: "#0a0f1e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#e2e8f0",
            a: { color: "#4d82ff" },
            strong: { color: "#f1f5f9" },
            h1: { color: "#f1f5f9" },
            h2: { color: "#f1f5f9" },
            h3: { color: "#f1f5f9" },
            h4: { color: "#f1f5f9" },
            code: { color: "#84aeff", backgroundColor: "#172033" },
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            blockquote: {
              borderLeftColor: "#1a56ff",
              color: "#94a3b8",
            },
            hr: { borderColor: "#1e293b" },
            th: { color: "#f1f5f9" },
            td: { color: "#e2e8f0" },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
