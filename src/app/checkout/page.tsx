"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatRupees } from "@/lib/money";
import UpiPayment from "@/components/UpiPayment";

interface EtaResponse {
  estimatedDays: number;
  estimatedDate: string;
  basis: "historical" | "default";
}

export default function CheckoutPage() {
  const { lines, subtotalPaise, clear } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [eta, setEta] = useState<EtaResponse | null>(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; number: string } | null>(null);

  useEffect(() => {
    if (!/^\d{6}$/.test(form.pincode)) {
      setEta(null);
      return;
    }
    setEtaLoading(true);
    const controller = new AbortController();
    fetch(`/api/eta?pincode=${form.pincode}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setEta(data.error ? null : data))
      .catch(() => {})
      .finally(() => setEtaLoading(false));
    return () => controller.abort();
  }, [form.pincode]);

  if (lines.length === 0 && !placedOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-500">
        Your cart is empty.{" "}
        <a href="/" className="text-rose-600 font-medium">
          Go shopping
        </a>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.email && !form.mobile) {
      setError("Enter at least a mobile number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong placing your order");
        return;
      }
      setPlacedOrder({ id: data.order_id, number: data.order_number });
      clear();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (placedOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1">Order placed! 🎉</h1>
        <p className="text-slate-500 mb-6">
          Order <span className="font-mono font-medium">{placedOrder.number}</span> — complete
          payment below to confirm it.
        </p>
        <UpiPayment orderId={placedOrder.id} orderNumber={placedOrder.number} amountPaise={subtotalPaise} />
        <div className="mt-6 flex gap-3">
          <a
            href={`/track?order=${placedOrder.number}`}
            className="flex-1 text-center border border-rose-200 text-rose-600 rounded-full py-2.5 font-medium"
          >
            Track this order
          </a>
          <a
            href="/"
            className="flex-1 text-center bg-rose-600 text-white rounded-full py-2.5 font-medium"
          >
            Continue shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full name">
          <input
            required
            className="input"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </Field>
        <Field label="Mobile number">
          <input
            required
            inputMode="numeric"
            placeholder="10-digit mobile"
            className="input"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
          />
        </Field>
        <Field label="Email (optional)">
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Delivery address">
          <input
            required
            placeholder="House / flat, street"
            className="input"
            value={form.address_line1}
            onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
          />
        </Field>
        <Field label="Landmark / area (optional)">
          <input
            className="input"
            value={form.address_line2}
            onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input
              required
              className="input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </Field>
          <Field label="State">
            <input
              required
              className="input"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Pincode">
          <input
            required
            inputMode="numeric"
            className="input"
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          />
        </Field>

        {form.pincode.length === 6 && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-sm">
            {etaLoading ? (
              <span className="text-slate-400">Estimating delivery time…</span>
            ) : eta ? (
              <span>
                📦 Estimated delivery:{" "}
                <strong>
                  {eta.estimatedDays} day{eta.estimatedDays === 1 ? "" : "s"}
                </strong>{" "}
                (by {new Date(eta.estimatedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})
                {eta.basis === "historical" && (
                  <span className="text-slate-400"> — based on past deliveries to your area</span>
                )}
              </span>
            ) : (
              <span className="text-slate-400">Could not estimate delivery time yet</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-rose-100 pt-4 mt-2">
          <span className="text-slate-600">Total</span>
          <span className="text-xl font-bold">{formatRupees(subtotalPaise)}</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={submitting}
          className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-medium rounded-full py-3 mt-2"
        >
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600 font-medium">{label}</span>
      {children}
    </label>
  );
}
