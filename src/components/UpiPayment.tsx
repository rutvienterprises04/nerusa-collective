"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatRupees } from "@/lib/money";

export default function UpiPayment({
  orderId,
  orderNumber,
  amountPaise,
}: {
  orderId: string;
  orderNumber: string;
  amountPaise: number;
}) {
  const upiId = process.env.NEXT_PUBLIC_UPI_ID;
  const payeeName = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "Shop";
  const amountRupees = (amountPaise / 100).toFixed(2);

  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!upiId) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4">
        UPI ID not configured yet. Set NEXT_PUBLIC_UPI_ID in .env.local.
      </div>
    );
  }

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent("Order " + orderNumber)}`;

  async function submitReference(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (reference.trim().length < 4) {
      setError("Enter the UPI transaction reference / UTR number from your payment app");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upi_reference: reference.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not record payment reference");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm">
        ✅ Thanks! We've noted your payment reference. Your order will be confirmed shortly after
        we verify it.
      </div>
    );
  }

  return (
    <div className="bg-white border border-rose-100 rounded-2xl p-5 flex flex-col items-center gap-4">
      <p className="text-sm text-slate-600 text-center">
        Scan with any UPI app (GPay, PhonePe, Paytm…) and pay{" "}
        <strong>{formatRupees(amountPaise)}</strong>
      </p>
      <QRCodeSVG value={upiUrl} size={200} />
      <p className="text-sm text-slate-500">
        or pay to UPI ID: <span className="font-mono font-medium text-slate-700">{upiId}</span>
      </p>

      <form onSubmit={submitReference} className="w-full flex flex-col gap-2 mt-2">
        <label className="text-sm font-medium text-slate-600">
          After paying, enter the transaction reference / UTR number shown in your UPI app
        </label>
        <input
          className="input"
          placeholder="e.g. 123456789012"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={submitting}
          className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-medium rounded-full py-2.5"
        >
          {submitting ? "Submitting…" : "I've paid — submit reference"}
        </button>
      </form>
    </div>
  );
}
