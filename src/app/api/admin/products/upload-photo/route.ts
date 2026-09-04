import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAdminAuthed } from "@/lib/adminAuth";
import { enhanceAndWatermark } from "@/lib/imageProcessing";
import { uploadProductImage } from "@/lib/storage";

export const runtime = "nodejs"; // sharp needs the Node runtime, not Edge

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("photo");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No photo uploaded" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Photo must be JPEG, PNG, or WebP" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo must be under 10MB" }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const id = randomUUID();

  try {
    const enhancedBuffer = await enhanceAndWatermark(inputBuffer);

    const [originalUrl, enhancedUrl] = await Promise.all([
      uploadProductImage(`products/${id}-original.jpg`, inputBuffer, file.type),
      uploadProductImage(`products/${id}-enhanced.jpg`, enhancedBuffer, "image/jpeg"),
    ]);

    return NextResponse.json({ image_url: enhancedUrl, original_image_url: originalUrl });
  } catch (err) {
    console.error("Photo upload/processing failed", err);
    return NextResponse.json(
      { error: "Could not process photo — check the Supabase Storage bucket is set up (see README)" },
      { status: 500 }
    );
  }
}
