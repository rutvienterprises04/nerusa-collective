"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { SITE_NAME } from "@/lib/siteConfig";

export default function SiteHeader() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-rose-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-rose-600">
          🎁 {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-rose-600">
            Shop
          </Link>
          <Link href="/track" className="hover:text-rose-600">
            Track Order
          </Link>
          <Link href="/cart" className="relative hover:text-rose-600">
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-rose-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
