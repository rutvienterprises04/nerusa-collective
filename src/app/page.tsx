import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { Product } from "@/types/db";
import ProductCard from "@/components/ProductCard";
import { SITE_TAGLINE } from "@/lib/siteConfig";

export const revalidate = 30; // refresh product list periodically

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    // Supabase not configured yet — show empty state instead of crashing.
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Return Gifts for Every Celebration</h1>
        <p className="text-slate-500 mt-1">{SITE_TAGLINE}</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-slate-400 py-20 border border-dashed border-rose-200 rounded-2xl">
          <p className="font-medium">No products yet.</p>
          <p className="text-sm mt-1">
            Add products in Supabase Studio (Table Editor &rarr; products) — see README for setup.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
