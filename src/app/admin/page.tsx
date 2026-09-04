import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import AdminOrderRow from "@/components/AdminOrderRow";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const supabase = createServiceSupabaseClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers!inner(full_name, mobile, city, pincode)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <a href="/admin/products" className="text-sm text-rose-600 font-medium">
          Manage products &rarr;
        </a>
      </div>

      {!orders || orders.length === 0 ? (
        <p className="text-slate-400">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase text-slate-400 border-b border-rose-100">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Payment ref</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <AdminOrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
