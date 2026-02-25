import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "accent-1": "rgb(var(--color-accent-1) / <alpha-value>)",
        "accent-2": "rgb(var(--color-accent-2) / <alpha-value>)",
        "accent-3": "rgb(var(--color-accent-3) / <alpha-value>)",
        "accent-4": "rgb(var(--color-accent-4) / <alpha-value>)",
        contrast: "rgb(var(--color-contrast) / <alpha-value>)",
      },
    },
  },
} satisfies Config;
