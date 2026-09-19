/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#121212",
          50: "#282828",
          100: "#222222",
          200: "#1e1e1e",
          300: "#1a1a1a",
          400: "#161616",
          500: "#121212", // Base dark charcoal
          600: "#0f0f0f",
          700: "#0c0c0c",
          800: "#090909",
          900: "#050505",
        },
        gold: {
          DEFAULT: "#D4AF37", // Metallic gold primary accent
          50: "#FAF7EE",
          100: "#F5EED5",
          200: "#ECDDAC",
          300: "#E3CC83",
          400: "#DABC5A",
          500: "#D4AF37", // Metallic gold
          600: "#B89428",
          700: "#8C711E",
          800: "#604E15",
          900: "#342A0B",
        },
        primary: {
          DEFAULT: "#D4AF37",
          hover: "#C5A028",
          foreground: "#121212",
        },
        surface: {
          DEFAULT: "#181818",
          card: "#1E1E1E",
          hover: "#252525",
          border: "#2E2E2E",
        },
      },
    },
  },
  plugins: [],
};
