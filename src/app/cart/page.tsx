"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatRupees } from "@/lib/money";

export default function CartPage() {
  const { lines, updateQty, removeItem, subtotalPaise } = useCart();

  if (lines.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">Your cart is empty.</p>
        <Link href="/" className="inline-block mt-4 text-rose-600 font-medium">
          &larr; Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="flex flex-col gap-4">
        {lines.map((line) => (
          <div
            key={line.product_id}
            className="flex items-center gap-4 bg-white border border-rose-100 rounded-xl p-3"
          >
            <div className="h-16 w-16 rounded-lg bg-rose-50 flex items-center justify-center overflow-hidden shrink-0">
              {line.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.image_url} alt={line.name} className="object-cover w-full h-full" />
              ) : (
                <span className="text-2xl">🎁</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{line.name}</p>
              <p className="text-sm text-slate-500">{formatRupees(line.unit_price_paise)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="h-7 w-7 rounded-full border border-rose-200 text-rose-600"
                onClick={() => updateQty(line.product_id, line.quantity - 1)}
              >
                −
              </button>
              <span className="w-6 text-center">{line.quantity}</span>
              <button
                className="h-7 w-7 rounded-full border border-rose-200 text-rose-600"
                onClick={() => updateQty(line.product_id, line.quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              className="text-xs text-slate-400 hover:text-rose-600 ml-2"
              onClick={() => removeItem(line.product_id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-rose-100 pt-4">
        <span className="text-slate-600">Subtotal</span>
        <span className="text-xl font-bold text-slate-800">{formatRupees(subtotalPaise)}</span>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block text-center bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-full py-3"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
