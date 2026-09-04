"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminProductForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_rupees: "",
    moq: "1",
    stock_qty: "",
  });
  const [photo, setPhoto] = useState<{ image_url: string; original_image_url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setPhoto(null);
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch("/api/admin/products/upload-photo", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not process photo");
        return;
      }
      setPhoto({ image_url: data.image_url, original_image_url: data.original_image_url });
    } catch {
      setError("Network error uploading photo — please try again");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!photo) {
      setError("Upload a photo first");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price_rupees: parseFloat(form.price_rupees),
          moq: parseInt(form.moq || "1", 10),
          stock_qty: parseInt(form.stock_qty || "0", 10),
          image_url: photo.image_url,
          original_image_url: photo.original_image_url,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not add product");
        return;
      }
      setForm({ name: "", description: "", price_rupees: "", moq: "1", stock_qty: "" });
      setPhoto(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-rose-100 rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="font-semibold">Add a product</h2>

      <div>
        <label className="text-sm font-medium text-slate-600 block mb-1">
          Photo — upload the plain product photo, we'll auto-polish it and add your watermark
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="text-sm"
        />
        {uploading && <p className="text-xs text-slate-400 mt-1">Enhancing photo…</p>}
        {photo && (
          <div className="mt-2 flex gap-3 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.image_url} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-rose-100" />
            <span className="text-xs text-emerald-600">✓ Enhanced &amp; watermarked</span>
          </div>
        )}
      </div>

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
      <div className="grid grid-cols-3 gap-3">
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
          min={1}
          className="input"
          placeholder="MOQ"
          value={form.moq}
          onChange={(e) => setForm({ ...form, moq: e.target.value })}
        />
        <input
          required
          type="number"
          className="input"
          placeholder="Stock qty"
          value={form.stock_qty}
          onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={submitting || uploading}
        className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-medium rounded-full py-2.5"
      >
        {submitting ? "Adding…" : "Add product"}
      </button>
    </form>
  );
}
