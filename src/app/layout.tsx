import type { Metadata, Viewport } from "next";
import "@fontsource/space-grotesk/300.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { profile } from "@/data/profile";

const description = `${profile.name} — ${profile.fullTitle} in ${profile.location}. An explorable 3D laboratory of projects, systems and music. ${profile.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: `${profile.name} — ${profile.fullTitle}`, template: `%s — ${profile.name}` },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    title: profile.title,
    description,
    url: "/",
    siteName: profile.name,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: profile.title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080B12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) inject attributes on <body> before hydration. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
