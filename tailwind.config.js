/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          50: "#fff8f1",
          100: "#feeee2",
          200: "#fcdbc4",
          300: "#fabf96",
          400: "#f7965f",
          500: "#ff6b2b", // Vibrant studio terracotta (TikTak style)
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        wood: {
          950: "#130e0a", // Deep warm mahogany
          900: "#1a130e",
          850: "#221913",
          800: "#2d211a",
          700: "#3d2e24",
          600: "#523e31",
        },
        tape: {
          dark: "#161214",
          amber: "#f59e0b",
          gold: "#d97706",
          cream: "#fbf8f3",
          parchment: "#f4ede1",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Barlow Condensed", "Montserrat", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
