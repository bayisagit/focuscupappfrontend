import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import AastuLogoLoader from "@/components/AastuLogoLoader";
import MobileAppInstallBanner from "@/components/MobileAppInstallBanner";

export const metadata: Metadata = {
  title: "AASTU Focus Cup Fellowship – Focus Football Cup",
  description:
    "Official tournament and community platform for AASTU Focus Fellowship. Fixtures, live results, league standings, player profiles, and fellowship in Christ.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "640x640", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B132B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Focus Cup" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Focus Cup" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0B132B] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 bg-[#0B132B] border-b border-[#2C3960]/60" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">
            <Suspense fallback={<AastuLogoLoader />}>
              {children}
            </Suspense>
          </main>
          <Footer />
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
          <MobileAppInstallBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
