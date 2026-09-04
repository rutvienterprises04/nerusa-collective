import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order")?.trim();
  const mobile = req.nextUrl.searchParams.get("mobile")?.trim();

  if (!orderNumber || !mobile) {
    return NextResponse.json({ error: "Provide order number and mobile number" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, customers!inner(full_name, mobile, city, pincode), order_items(*)")
    .eq("order_number", orderNumber.toUpperCase())
    .eq("customers.mobile", mobile)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "No matching order found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
