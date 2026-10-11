import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every route is static, so the site builds to plain files in out/: any static host can
  // serve it (Vercel, and Cloudflare Pages, which has no Next.js server).
  output: "export",
  reactStrictMode: true,
  transpilePackages: ["three"],
};

export default nextConfig;
