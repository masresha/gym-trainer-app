import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: "#16a34a",
          dark: "#15803d",
          light: "#22c55e",
          lime: "#84cc16",
        },
        energy: {
          DEFAULT: "#f97316", // orange — used for accents / "push" moments
          light: "#fb923c",
          glow: "#fdba74",
        },
        ink: "#0b1120",
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(22, 163, 74, 0.45)",
        "glow-energy": "0 10px 40px -10px rgba(249, 115, 22, 0.5)",
        lift: "0 20px 50px -20px rgba(2, 6, 23, 0.25)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(120deg, #15803d 0%, #16a34a 40%, #84cc16 100%)",
        "energy-gradient": "linear-gradient(120deg, #f97316 0%, #fb923c 50%, #f59e0b 100%)",
        "hero-mesh":
          "radial-gradient(60% 60% at 15% 10%, rgba(132,204,22,0.18) 0%, transparent 60%), radial-gradient(50% 50% at 90% 20%, rgba(22,163,74,0.18) 0%, transparent 60%), radial-gradient(60% 60% at 80% 100%, rgba(249,115,22,0.12) 0%, transparent 60%)",
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
        pop: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "60%": { transform: "scale(1.02)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "ring-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(34,197,94,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0)" },
        },
        "bar-grow": {
          "0%": { width: "0%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease both",
        pop: "pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        shimmer: "shimmer 2.2s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "ring-pulse": "ring-pulse 2s ease-in-out infinite",
        "bar-grow": "bar-grow 1s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
