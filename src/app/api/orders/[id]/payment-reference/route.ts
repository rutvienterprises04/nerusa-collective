import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  upi_reference: z.string().min(4).max(64),
});

export async function POST(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/payment-reference">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the UPI transaction reference / UTR number" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .update({
      upi_reference: parsed.data.upi_reference,
      status: "payment_pending_verification",
    })
    .eq("id", id)
    .eq("status", "placed") // only allow this once, right after placing the order
    .select("id")
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json(
      { error: "Could not record payment reference — order may already be past this step" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
