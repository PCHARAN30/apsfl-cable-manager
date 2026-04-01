/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Sora'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          50:  "#edfcf4",
          100: "#d3f8e4",
          200: "#a9efcc",
          300: "#71e1ad",
          400: "#38cb8a",
          500: "#15b070",
          600: "#0a8f5a",
          700: "#09724a",
          800: "#0b593c",
          900: "#0a4932",
        },
        slate: {
          850: "#172032",
          950: "#0b1120",
        }
      }
    },
  },
  plugins: [],
}
