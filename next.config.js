const withCSS = require("@zeit/next-css")
const withPurgeCss = require("next-purgecss")
const withFonts = require("next-fonts")

module.exports = withCSS(
  {
    env: {
      API_URL: process.env.API_URL,
    },
  },
  withPurgeCss({
    purgeCssPaths: [
      "pages/**/*",
      "components/**/*", // also scan other-components folder
    ],
  })
)

module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Note: we provide webpack above so you should not `require` it
    // Perform customizations to webpack config
    config.plugins.push(new webpack.IgnorePlugin(/\/__tests__\//))

    // Important: return the modified config
    return config
  },
}
