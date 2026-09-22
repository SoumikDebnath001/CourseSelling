import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "The Obuya Blueprint",
  description: "Learn cricket from the academy: structured courses, videos, tests and coaching.",
  icons: { icon: "/brand/favicon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-ink-50 font-sans text-ink-900 antialiased">
        {/* Without JS the loader could never be dismissed — hide it outright. */}
        <noscript>
          <style>{`#app-loader{display:none!important}`}</style>
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
