import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: "var(--color-cream)",
          charcoal: "var(--color-charcoal)",
          gray: "var(--color-warm-gray)",
          green: "var(--color-green)",
          "green-light": "var(--color-green-light)",
          error: "var(--color-error)",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
