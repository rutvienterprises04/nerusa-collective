"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminProductForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_rupees: "",
    image_url: "",
    stock_qty: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price_rupees: parseFloat(form.price_rupees),
          image_url: form.image_url,
          stock_qty: parseInt(form.stock_qty || "0", 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not add product");
        return;
      }
      setForm({ name: "", description: "", price_rupees: "", image_url: "", stock_qty: "" });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-rose-100 rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="font-semibold">Add a product</h2>
      <input
        required
        className="input"
        placeholder="Name (e.g. Mini Photo Frame Return Gift)"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <textarea
        className="input"
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          required
          type="number"
          step="0.01"
          className="input"
          placeholder="Price (₹)"
          value={form.price_rupees}
          onChange={(e) => setForm({ ...form, price_rupees: e.target.value })}
        />
        <input
          required
          type="number"
          className="input"
          placeholder="Stock quantity"
          value={form.stock_qty}
          onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
        />
      </div>
      <input
        className="input"
        placeholder="Image URL (optional)"
        value={form.image_url}
        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={submitting}
        className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-medium rounded-full py-2.5"
      >
        {submitting ? "Adding…" : "Add product"}
      </button>
    </form>
  );
}
