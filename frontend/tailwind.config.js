/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563eb",
          purple: "#7c3aed",
        },
      },
      borderRadius: {
        xl: "0.85rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
