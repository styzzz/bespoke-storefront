import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Condensed, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME } from "@/lib/config";

import "./globals.css";

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const data = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-data",
  display: "swap",
});

const DEFAULT_SITE_URL = "https://bespoke.madefromearth.com";

/** Tolerates a missing or scheme-less NEXT_PUBLIC_SITE_URL instead of failing the build. */
function siteUrl(): URL {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim();
  try {
    return new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description:
    "Build your own serum or moisturizer: choose a base, add actives, finish with collagen or plant stem cells. Made to order by Made from Earth.",
  openGraph: { siteName: SITE_NAME, type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f8f5",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${data.variable}`}>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <SiteHeader />
        <div id="content">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
