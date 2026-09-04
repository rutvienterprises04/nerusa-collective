"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import OrderStatusTimeline from "@/components/OrderStatusTimeline";
import { formatRupees } from "@/lib/money";
import { OrderStatus } from "@/types/db";

interface TrackedOrder {
  order_number: string;
  status: OrderStatus;
  total_paise: number;
  estimated_delivery_date: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  order_items: { product_name: string; quantity: number; line_total_paise: number }[];
}

function TrackForm() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [mobile, setMobile] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/track?order=${encodeURIComponent(orderNumber)}&mobile=${encodeURIComponent(mobile)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Track your order</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-8">
        <input
          className="input"
          placeholder="Order number (e.g. NRC-20260904-1234)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <input
          className="input"
          placeholder="Mobile number used for the order"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
        />
        <button
          disabled={loading}
          className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-medium rounded-full py-2.5"
        >
          {loading ? "Searching…" : "Track order"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {order && (
        <div className="bg-white border border-rose-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono font-medium">{order.order_number}</span>
            <span className="font-bold">{formatRupees(order.total_paise)}</span>
          </div>

          <OrderStatusTimeline status={order.status} />

          {order.estimated_delivery_date && (
            <p className="text-sm text-slate-500 mt-2">
              📦 Estimated delivery:{" "}
              {new Date(order.estimated_delivery_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
          {order.courier_name && (
            <p className="text-sm text-slate-500 mt-1">Courier: {order.courier_name}</p>
          )}
          {order.tracking_url && (
            <a href={order.tracking_url} target="_blank" className="text-sm text-rose-600 underline">
              View courier tracking
            </a>
          )}

          <div className="mt-4 border-t border-rose-100 pt-3 flex flex-col gap-1">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-slate-600">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span>{formatRupees(item.line_total_paise)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackForm />
    </Suspense>
  );
}
