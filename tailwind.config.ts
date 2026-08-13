import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-navy": "#041B33",
        navy: "#082B4C",
        cream: "#F7F1E5",
        gold: "#D9A441",
        "tropical-green": "#1F8A70",
        teal: "#0E8EA8",
        coral: "#E76F51",
        muted: "#6B7280",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(4, 27, 51, 0.35)",
        panel: "0 20px 60px -12px rgba(4, 27, 51, 0.55)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.35s ease-out",
        slideIn: "slideIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
