"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupees } from "@/lib/money";
import { Product } from "@/types/db";

export default function AdminProductRow({ product }: { product: Product }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function toggleActive() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      if (res.ok) router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <tr className="border-b border-rose-50">
      <td className="py-2 pr-4">{product.name}</td>
      <td className="py-2 pr-4">{formatRupees(product.price_paise)}</td>
      <td className="py-2 pr-4">{product.moq}</td>
      <td className="py-2 pr-4">{product.stock_qty}</td>
      <td className="py-2 pr-4">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {product.is_active ? "Active" : "Hidden"}
        </span>
      </td>
      <td className="py-2 pr-4">
        <button
          disabled={updating}
          onClick={toggleActive}
          className="text-xs font-medium border border-rose-200 text-rose-600 rounded-full px-3 py-1.5"
        >
          {product.is_active ? "Hide" : "Show"}
        </button>
      </td>
    </tr>
  );
}
