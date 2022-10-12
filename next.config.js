// const withCSS = require("@zeit/next-css")
const withPurgeCss = require("next-purgecss")
const withFonts = require("next-fonts")
const withBabelMinify = require("next-babel-minify")({
  comments: false,
})
const withPlugins = require("next-compose-plugins")

module.exports = {
  reactStrictMode: true,
}

module.exports = {
  images: {
    domains: ["nextjs.org", "farnamh.ir", "farnam.tech"],
  },
}

// module.exports = withPlugins([], {
//   webpack5: false,
// })

// module.exports = withCSS(
//   {
//     env: {
//       API_URL: process.env.API_URL,
//     },
//   },
//   withPurgeCss({
//     purgeCssPaths: [
//       "pages/**/*",
//       "components/**/*", // also scan other-components folder
//     ],
//   })
// )
