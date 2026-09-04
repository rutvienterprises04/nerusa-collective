import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/adminAuth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { createShipment, assignAwb } from "@/lib/shiprocket";
import { recomputeDeliveryStats } from "@/lib/eta";
import { OrderStatus } from "@/types/db";

const schema = z.object({
  status: z.enum([
    "placed",
    "payment_pending_verification",
    "confirmed",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
});

const STAGE_TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  confirmed: "confirmed_at",
  packed: "packed_at",
  shipped: "shipped_at",
  delivered: "delivered_at",
  cancelled: "cancelled_at",
};

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/orders/[id]">) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*, customers!inner(pincode)")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const newStatus = parsed.data.status;
  const updates: Record<string, unknown> = { status: newStatus };
  const tsField = STAGE_TIMESTAMP_FIELD[newStatus];
  if (tsField) updates[tsField] = new Date().toISOString();

  if (newStatus === "confirmed" && order.payment_confirmed_at === null) {
    updates.payment_confirmed_at = new Date().toISOString();
    updates.payment_confirmed_by = "admin";

    // Create the shipment on Shiprocket (mock mode until credentials are set).
    try {
      const shipment = await createShipment({
        orderNumber: order.order_number,
        customer: {
          name: order.customers.full_name ?? "",
          mobile: order.customers.mobile ?? "",
          email: order.customers.email ?? null,
          address_line1: order.customers.address_line1 ?? "",
          address_line2: order.customers.address_line2 ?? null,
          city: order.customers.city ?? "",
          state: order.customers.state ?? "",
          pincode: order.customers.pincode ?? "",
        },
        items: [],
        totalRupees: order.total_paise / 100,
      });
      updates.shiprocket_order_id = shipment.shiprocketOrderId;
      updates.shiprocket_shipment_id = shipment.shiprocketShipmentId;
    } catch {
      // Non-fatal — order still gets confirmed even if Shiprocket call fails;
      // shipment can be created manually or retried later.
    }
  }

  if (newStatus === "shipped" && order.shiprocket_shipment_id) {
    try {
      const awb = await assignAwb(order.shiprocket_shipment_id);
      updates.shiprocket_awb = awb.awb;
      updates.courier_name = awb.courierName;
      updates.tracking_url = awb.trackingUrl;
    } catch {
      // non-fatal
    }
  }

  const { error: updateErr } = await supabase.from("orders").update(updates).eq("id", id);
  if (updateErr) {
    return NextResponse.json({ error: "Could not update order" }, { status: 500 });
  }

  if (newStatus === "delivered") {
    await recomputeDeliveryStats(order.customers.pincode).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
