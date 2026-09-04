import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/adminAuth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  is_active: z.boolean().optional(),
  stock_qty: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/products/[id]">) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not update product" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
