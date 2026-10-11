import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";

// Generated once at build time (the site is a static export).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: profile.siteUrl, changeFrequency: "monthly", priority: 1 }];
}
