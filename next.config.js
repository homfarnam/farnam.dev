/** @type {import('next').NextConfig} */
const securityHeaders = []

module.exports = {
  reactStrictMode: true,
}

module.exports = {
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
    ]
  },
}
