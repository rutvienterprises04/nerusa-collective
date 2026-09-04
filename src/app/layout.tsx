import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import SiteHeader from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_TAGLINE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-rose-50 text-slate-800">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="text-center text-xs text-slate-400 py-6">
            {SITE_NAME} &middot; {SITE_TAGLINE}
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
