"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupees } from "@/lib/money";
import { ORDER_STATUS_LABELS, OrderStatus } from "@/types/db";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "confirmed",
  payment_pending_verification: "confirmed",
  confirmed: "packed",
  packed: "shipped",
  shipped: "out_for_delivery",
  out_for_delivery: "delivered",
};

export default function AdminOrderRow({
  order,
}: {
  order: {
    id: string;
    order_number: string;
    status: OrderStatus;
    total_paise: number;
    upi_reference: string | null;
    estimated_delivery_date: string | null;
    customers: { full_name: string; mobile: string; city: string; pincode: string };
  };
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const nextStatus = NEXT_STATUS[order.status];

  async function updateStatus(status: OrderStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <tr className="border-b border-rose-50 align-top">
      <td className="py-3 pr-4">
        <div className="font-mono text-sm">{order.order_number}</div>
        <div className="text-xs text-slate-400">{formatRupees(order.total_paise)}</div>
      </td>
      <td className="py-3 pr-4 text-sm">
        <div>{order.customers.full_name}</div>
        <div className="text-slate-400">{order.customers.mobile}</div>
        <div className="text-slate-400">
          {order.customers.city} - {order.customers.pincode}
        </div>
      </td>
      <td className="py-3 pr-4 text-sm">
        {order.upi_reference ? (
          <span className="font-mono text-xs bg-slate-100 rounded px-2 py-1">
            {order.upi_reference}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-rose-100 text-rose-700">
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </td>
      <td className="py-3 pr-4">
        <div className="flex gap-2">
          {nextStatus && (
            <button
              disabled={updating}
              onClick={() => updateStatus(nextStatus)}
              className="text-xs font-medium bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-full px-3 py-1.5"
            >
              Mark {ORDER_STATUS_LABELS[nextStatus]}
            </button>
          )}
          {order.status !== "cancelled" && order.status !== "delivered" && (
            <button
              disabled={updating}
              onClick={() => updateStatus("cancelled")}
              className="text-xs font-medium border border-slate-200 text-slate-500 rounded-full px-3 py-1.5"
            >
              Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
