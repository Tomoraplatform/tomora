import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import { TikTokPageViews } from "@/components/analytics/tiktok-pixel";
import { tiktokBaseCode } from "@/lib/tiktok/base-code";

const sans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tomora.com.ng"),
  title: {
    default: "Tomora | Build Your Business Website in Minutes",
    template: "%s | Tomora",
  },
  description:
    "No code. No stress. Pick a template, add your brand, and go live. Built for African businesses.",
  keywords: [
    "website builder", "no code website", "Nigeria website builder", "African business website",
    "online store builder", "church website", "NGO website", "ecommerce Nigeria", "Tomora",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Tomora",
    url: "https://www.tomora.com.ng",
    title: "Tomora | Build Your Business Website in Minutes",
    description:
      "No code. No stress. Pick a template, add your brand, and go live. Built for African businesses.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Tomora, build your business website in minutes" }],
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tomora | Build Your Business Website in Minutes",
    description:
      "No code. No stress. Pick a template, add your brand, and go live. Built for African businesses.",
    images: ["/og.jpg"],
  },
  // Favicon + touch icon resolved from app/icon.svg, app/icon.png, app/apple-icon.png
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    <html lang="en">
      <head>
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />}
        {supabaseOrigin && <link rel="dns-prefetch" href={supabaseOrigin} />}
        {/* TikTok base code. In the head and in the served HTML, which is where
            Events Manager looks for it. It disables itself on a customer's
            storefront, see lib/tiktok/base-code. */}
        <script dangerouslySetInnerHTML={{ __html: tiktokBaseCode() }} />
      </head>
      <body className={`${sans.variable} font-sans antialiased`}>
        {children}
        {/* Page views for navigations, which do not reload the document. */}
        <Suspense fallback={null}>
          <TikTokPageViews />
        </Suspense>
      </body>
    </html>
  );
}
