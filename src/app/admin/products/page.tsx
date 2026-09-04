import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import AdminProductForm from "@/components/AdminProductForm";
import AdminProductRow from "@/components/AdminProductRow";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const supabase = createServiceSupabaseClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <a href="/admin" className="text-sm text-rose-600 font-medium">
          &larr; Back to orders
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <AdminProductForm />

        <div className="bg-white border border-rose-100 rounded-2xl p-5 overflow-x-auto">
          <h2 className="font-semibold mb-3">All products</h2>
          {!products || products.length === 0 ? (
            <p className="text-slate-400 text-sm">No products yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-400 border-b border-rose-100">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">MOQ</th>
                  <th className="py-2 pr-4">Stock</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <AdminProductRow key={p.id} product={p} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
