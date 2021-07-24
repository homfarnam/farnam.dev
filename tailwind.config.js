const defaultTheme = require("tailwindcss/defaultTheme")

module.exports = {
  purge: [
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./wrappers/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: false, // or 'media' or 'class'
  mode: "jit",
  theme: {
    fontFamily: {
      custom: ["Titillium Web", "sans-serif"],
      apparel: ["Apparel", "sans-serif"],
      pilat: ["Pilat Extended", "sans-serif"],
      Montserrat_Alternate: ["Montserrat Alternates", "sans-serif"],
      sans: [
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        '"Noto Sans"',
        "sans-serif",
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      serif: ["Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
      mono: [
        "Menlo",
        "Monaco",
        "Consolas",
        '"Liberation Mono"',
        '"Courier New"',
        "monospace",
      ],
    },
  },
  variants: {
    extend: {},
  },
  corePlugins: {
    backgroundImage: true,
  },
  plugins: [],
}
