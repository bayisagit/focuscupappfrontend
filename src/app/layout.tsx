import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "AASTU Focus Fellowship – Focus Football Cup",
  description:
    "Official tournament and community platform for AASTU Focus Fellowship. Fixtures, live results, league standings, player profiles, and fellowship in Christ.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
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
      </head>
      <body className="min-h-full flex flex-col bg-[#0B132B] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 bg-[#0B132B] border-b border-[#2C3960]/60" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
              {children}
            </Suspense>
          </main>
          <Footer />
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
