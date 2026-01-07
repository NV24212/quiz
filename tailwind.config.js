export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          background: "#1a1a1a",
          primary: "#ffffff",
          secondary: "#a0a0a0",
          border: "rgba(255, 255, 255, 0.1)",
        },
      },
      borderRadius: {
        20: "20px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.4)",
        insetSoft: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      },
      keyframes: {
        modalIn: {
          "0%": { opacity: 0, transform: "translateY(20px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        fadeOut: {
          "100%": { opacity: 0, transform: "scale(0.95)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "modal-in": "modalIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-out": "fadeOut 300ms ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
