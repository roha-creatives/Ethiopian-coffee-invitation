import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are bundled in src/fonts (OFL licensed) instead of fetched from Google at build time,
// which made builds fail intermittently (on Vercel too).

// Display face: bold, compact grotesque for headings
const display = localFont({
  src: [
    { path: "../fonts/kanit-500.woff2", weight: "500" },
    { path: "../fonts/kanit-600.woff2", weight: "600" },
    { path: "../fonts/kanit-700.woff2", weight: "700" },
  ],
  variable: "--f-display",
  display: "swap",
  fallback: ["system-ui", "Arial"],
});
// Text face: clean grotesque for body copy (variable font)
const body = localFont({
  src: "../fonts/inter-tight-latin-var.woff2",
  weight: "400 600",
  variable: "--f-body",
  display: "swap",
  fallback: ["system-ui", "Arial"],
});
// Amharic appears on the opening envelope, so it stays preloaded (variable font, Ethiopic subset)
const ethiopic = localFont({
  src: "../fonts/noto-sans-ethiopic-var.woff2",
  weight: "700 900",
  variable: "--f-ethi",
  display: "swap",
  fallback: ["Nyala", "Abyssinica SIL", "sans-serif"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const TITLE = "You're invited · The First Pour · Ethiopian Coffee by Hanan Tarq";
const DESCRIPTION =
  "Join us on Saturday, December 5, 2026 at 4 PM at Friendship Park, Phase Two, Addis Ababa, for the unveiling of Ethiopian Coffee by Hanan Tarq. ኑ ቡና ጠጡ.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s · Ethiopian Coffee by Hanan Tarq" },
  description: DESCRIPTION,
  applicationName: "Ethiopian Coffee by Hanan Tarq",
  keywords: ["Ethiopian coffee", "Hanan Tarq", "coffee launch", "Addis Ababa", "Friendship Park", "invitation", "ቡና"],
  authors: [{ name: "Ethiopian Coffee by Hanan Tarq" }],
  alternates: { canonical: "/" },
  // invitations are private: keep them out of search results, but allow link previews
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Ethiopian Coffee by Hanan Tarq",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["am_ET"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#e9f0f3" }, { media: "(prefers-color-scheme: dark)", color: "#24385c" }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${ethiopic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
