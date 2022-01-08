/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },

  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
]

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
    ]
  },
}
