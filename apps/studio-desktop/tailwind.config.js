/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "cs-canvas": "#080808",
        "cs-surface": "#111111",
        "cs-elevated": "#1A1A1A",
        "cs-modal": "#222222",
        "cs-hairline": "#1F1F1F",
        "cs-border": "#2C2C2C",
        "cs-active": "#3A3A3A",
        "cs-primary": "#F2F2F2",
        "cs-secondary": "#8A8A8A",
        "cs-muted": "#4A4A4A",
        "cs-violet": "#5A3A7A",
        "cs-indigo": "#3A4A7A",
        "cs-stable": "#4A7A4A",
        "cs-tension": "#7A6A3A",
        "cs-rose": "#7A3A3A",
      },
      animation: {
        "poet-pulse": "poetPulse 1200ms step-end infinite",
      },
      keyframes: {
        poetPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
