/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0a0a0a",
          card: "#111111",
          border: "#1a1a1a",
        },
        primary: "#00BFFF",
        secondary: "#7C3AED",
        success: "#22C55E",
        warning: "#EAB308",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [],
}
