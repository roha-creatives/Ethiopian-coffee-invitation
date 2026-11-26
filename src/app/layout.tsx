import type { Metadata, Viewport } from "next";
import { Kanit, Inter_Tight, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";

// Display face: bold, compact grotesque for headings
const display = Kanit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--f-display",
  display: "swap",
});
// Text face: clean grotesque for body copy
const body = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--f-body",
  display: "swap",
});
// Amharic appears on the opening envelope, so it stays preloaded
const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["700", "900"],
  variable: "--f-ethi",
  display: "swap",
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
