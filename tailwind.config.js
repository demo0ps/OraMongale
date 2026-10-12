/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // OraMongale brand palette, taken from the logo:
        //   deep navy  #0A2A5C (mountain peaks, "Mongale" wordmark)
        //   gold       #D4A017 (gold mountain, "Ora" wordmark, the sweep)
        //   bright gold#E8B923 (hover states for gold)
        ink: "#0a1a33",
        coal: "#0A2A5C",
        slate2: "#2a4676",
        steel: "#6b7a8f",
        dust: "#d9dce2",
        bone: "#f6f7fa",
        navy: "#0A2A5C",
        gold: "#D4A017",
        goldbright: "#E8B923",
        whatsapp: "#25D366",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
