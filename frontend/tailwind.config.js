/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#b3d9ff",
          300: "#86c2ff",
          400: "#4fa4ff",
          500: "#1f86ff",
          600: "#1768db",
          700: "#134fb1",
          800: "#123f8a",
          900: "#102f66"
        },
        accent: {
          50: "#fff4ec",
          100: "#ffe7d6",
          200: "#ffc9a8",
          300: "#ff9f6a",
          400: "#ff7a3f",
          500: "#ff5b1f",
          600: "#e84612",
          700: "#c2360f",
          800: "#9b2b10",
          900: "#7c2510"
        }
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"]
      },
      boxShadow: {
        glow: "0 10px 30px rgba(31,134,255,0.25)",
        deep: "0 30px 80px rgba(2,8,23,0.35)"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        }
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
