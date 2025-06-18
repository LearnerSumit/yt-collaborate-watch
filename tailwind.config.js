/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "float-up": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-150px)", opacity: "0" },
        },
      },
      animation: {
        "float-up": "float-up 3s ease-out forwards",
      },
    },
  },
  plugins: [],
}

