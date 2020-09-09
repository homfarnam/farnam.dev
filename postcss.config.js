// module.exports = {
//   plugins: [
//     "tailwindcss",
//     process.env.NODE_ENV === "production"
//       ? [
//           "@fullhuman/postcss-purgecss",
//           {
//             content: [
//               "./pages/**/*.{js,jsx,ts,tsx}",
//               "./components/**/*.{js,jsx,ts,tsx}",
//             ],
//             defaultExtractor: (content) =>
//               content.match(/[\w-/:]+(?<!:)/g) || [],
//           },
//         ]
//       : undefined,
//     "postcss-preset-env",
//   ],
// }

module.exports = {
  plugins: [
    "tailwindcss",
    "postcss-flexbugs-fixes",
    [
      "postcss-preset-env",
      {
        autoprefixer: {
          flexbox: "no-2009",
        },
        stage: 3,
        features: {
          "custom-properties": false,
        },
      },
    ],
  ],
}
