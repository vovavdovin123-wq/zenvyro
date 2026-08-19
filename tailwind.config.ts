import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
        },
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        lavender: "var(--lavender)",
        accent: {
          cyan: "#27C5FF",
        },
        ink: {
          DEFAULT: "#F2F1F7",
          muted: "#8A8A94",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        alumni: ["var(--font-alumni)", "var(--font-display)", "sans-serif"],
      },
      backgroundImage: {
        brand: "var(--brand)",
      },
      maxWidth: {
        page: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
