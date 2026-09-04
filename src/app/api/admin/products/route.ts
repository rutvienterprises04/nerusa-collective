import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/adminAuth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  price_rupees: z.number().positive(),
  moq: z.number().int().positive().default(1),
  image_url: z.string().url().optional().or(z.literal("")),
  original_image_url: z.string().url().optional().or(z.literal("")),
  stock_qty: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("products").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    price_paise: Math.round(parsed.data.price_rupees * 100),
    moq: parsed.data.moq,
    image_url: parsed.data.image_url || null,
    original_image_url: parsed.data.original_image_url || null,
    stock_qty: parsed.data.stock_qty,
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ error: "Could not create product" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
