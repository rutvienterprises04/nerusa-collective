import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { generateOrderNumber } from "@/lib/orderNumber";
import { estimateDeliveryForPincode } from "@/lib/eta";

const cartLineSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const orderSchema = z.object({
  customer: z.object({
    full_name: z.string().min(2),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    email: z.string().email().optional().or(z.literal("")),
    address_line1: z.string().min(3),
    address_line2: z.string().optional().or(z.literal("")),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  }),
  items: z.array(cartLineSchema).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customer, items } = parsed.data;
  const supabase = createServiceSupabaseClient();

  // Upsert customer profile by mobile number.
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("*")
    .eq("mobile", customer.mobile)
    .maybeSingle();

  let customerId: string;
  if (existingCustomer) {
    customerId = existingCustomer.id;
    await supabase
      .from("customers")
      .update({
        full_name: customer.full_name,
        email: customer.email || null,
        address_line1: customer.address_line1,
        address_line2: customer.address_line2 || null,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
      })
      .eq("id", customerId);
  } else {
    const { data: created, error: createErr } = await supabase
      .from("customers")
      .insert({
        full_name: customer.full_name,
        mobile: customer.mobile,
        email: customer.email || null,
        address_line1: customer.address_line1,
        address_line2: customer.address_line2 || null,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
      })
      .select("id")
      .single();
    if (createErr || !created) {
      return NextResponse.json({ error: "Could not save customer profile" }, { status: 500 });
    }
    customerId = created.id;
  }

  // Look up live product prices/stock — never trust prices sent from the client.
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: productErr } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);

  if (productErr || !products || products.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products are no longer available" }, { status: 400 });
  }

  for (const item of items) {
    const product = products.find((p) => p.id === item.product_id);
    if (!product || !product.is_active) {
      return NextResponse.json({ error: `Product unavailable` }, { status: 400 });
    }
    if (product.stock_qty < item.quantity) {
      return NextResponse.json(
        { error: `Not enough stock for "${product.name}" (only ${product.stock_qty} left)` },
        { status: 400 }
      );
    }
    if (item.quantity < product.moq) {
      return NextResponse.json(
        { error: `"${product.name}" has a minimum order quantity of ${product.moq}` },
        { status: 400 }
      );
    }
  }

  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.product_id)!;
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price_paise: product.price_paise,
      quantity: item.quantity,
      line_total_paise: product.price_paise * item.quantity,
    };
  });

  const subtotalPaise = orderItems.reduce((sum, i) => sum + i.line_total_paise, 0);
  const shippingPaise = 0; // flat free shipping for now — adjust once Shiprocket rates are live
  const totalPaise = subtotalPaise + shippingPaise;

  const eta = await estimateDeliveryForPincode(customer.pincode).catch(() => null);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      customer_id: customerId,
      status: "placed",
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      total_paise: totalPaise,
      estimated_delivery_days: eta?.estimatedDays ?? null,
      estimated_delivery_date: eta?.estimatedDate ?? null,
    })
    .select("*")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  await supabase
    .from("order_items")
    .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

  // Decrement stock (best-effort; fine-grained locking not needed at this scale)
  for (const item of items) {
    const product = products.find((p) => p.id === item.product_id)!;
    await supabase
      .from("products")
      .update({ stock_qty: product.stock_qty - item.quantity })
      .eq("id", product.id);
  }

  return NextResponse.json({ order_number: order.order_number, order_id: order.id });
}
