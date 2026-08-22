import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ServiceWorker } from "@/components/service-worker";
import { SessionRefresher } from "@/components/session-refresher";
import { TimezoneCookie } from "@/components/timezone-cookie";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Keep an honest record of how you eat, sleep, move and feel. Your nutritionist reads it and coaches you against it.";

export const metadata: Metadata = {
  // A template means every page's own title still ends up branded.
  title: { default: "nutri", template: "%s" },
  description: DESCRIPTION,
  applicationName: "nutri",
  appleWebApp: { capable: true, title: "nutri", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: "nutri",
    title: "nutri — nutrition diary & coaching",
    description: DESCRIPTION,
  },
  twitter: { card: "summary", title: "nutri", description: DESCRIPTION },
  // A diary is nobody else's business; keep it out of search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  // Portrait phone in one hand, so the layout is built for it.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionRefresher />
        <TimezoneCookie />
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
