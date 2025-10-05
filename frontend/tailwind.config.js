/** @type {import('tailwindcss').Config} */

const withOpacity =
  (variable) =>
  ({ opacityValue }) =>
    opacityValue !== undefined
      ? `hsl(var(${variable}) / ${opacityValue})`
      : `hsl(var(${variable}))`;

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lobster Two", "cursive"],
        brand: ["Lobster Two", "cursive"],
        display: ["Lobster Two", "cursive"],
      },
      colors: {
        bg: withOpacity("--color-bg"),
        surface: withOpacity("--color-surface"),
        border: withOpacity("--color-border"),
        text: withOpacity("--color-text"),
        muted: withOpacity("--color-muted"),
        brand: withOpacity("--color-brand"),
        "brand-soft": withOpacity("--color-brand-soft"),
        danger: withOpacity("--color-danger"),
        hover: withOpacity("--color-hover"),
        success: withOpacity("--color-success"),
        "success-soft": withOpacity("--color-success-soft"),

        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
    },
  },
  plugins: [],
};
