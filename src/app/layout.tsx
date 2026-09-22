import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LocaleProvider } from "@/context/LocaleContext";

export const metadata: Metadata = {
  title: { default: "VARSHANETRA — National Flood Intelligence System", template: "%s — VARSHANETRA" },
  description: "India's multi-modal AI flood intelligence and decision-support platform. Real-time data fusion from satellite, radar, 800+ AWS stations and NWP models.",
  keywords: "flood intelligence, rainfall prediction, flood warning, IMD, AI weather, inundation, India, NDMA, disaster management",
  authors: [{ name: "VARSHANETRA Team" }],
  openGraph: {
    title: "VARSHANETRA — National Flood Intelligence System",
    description: "See the Rain. Predict the Flood. Save Lives.",
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: "VARSHANETRA", description: "National Flood Intelligence Platform" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070B14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        {/* Favicon */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌧️</text></svg>" />

        {/* Premium font stack — preconnect first for perf */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Space Grotesk (display/headings) + Inter (UI/body) + JetBrains Mono (data) + Noto Devanagari (vernacular) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{
          background: "var(--bg-base)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}
      >
        <AuthProvider>
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
