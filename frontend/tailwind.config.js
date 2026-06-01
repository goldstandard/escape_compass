/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f5f7ef",
        deep: "#10231f",
        accent: "#d94e41",
        calm: "#2f7e79",
      },
      boxShadow: {
        panel: "0 18px 30px -18px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
