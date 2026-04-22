/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/web/**/*.{html,svelte,ts,js}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // LogSeq-ish palette
        surface: {
          DEFAULT: "#1e1e2e",
          raised: "#27273a",
          overlay: "#313145",
        },
        accent: {
          DEFAULT: "#7c6af7",
          hover: "#9a8bf9",
        },
        danger: "#f38ba8",
        warning: "#fab387",
        success: "#a6e3a1",
        muted: "#6c6c8a",
      },
    },
  },
  plugins: [],
};
