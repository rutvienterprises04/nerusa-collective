"use client";

import { useState } from "react";
import { Product } from "@/types/db";
import { formatRupees } from "@/lib/money";
import { useCart } from "@/components/CartProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock_qty <= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden flex flex-col">
      <div className="aspect-square bg-rose-50 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-4xl">🎁</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-slate-800">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
        )}
        {product.moq > 1 && (
          <p className="text-xs text-slate-400">Min. order qty: {product.moq}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-bold text-rose-600">{formatRupees(product.price_paise)}</span>
          <button
            disabled={outOfStock}
            onClick={() => {
              addItem(
                {
                  product_id: product.id,
                  name: product.name,
                  unit_price_paise: product.price_paise,
                  image_url: product.image_url,
                },
                Math.max(1, product.moq)
              );
              setAdded(true);
              setTimeout(() => setAdded(false), 1200);
            }}
            className="text-sm font-medium px-3 py-1.5 rounded-full bg-rose-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-rose-700 transition"
          >
            {outOfStock ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
