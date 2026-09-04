import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const PRODUCT_IMAGES_BUCKET = "product-images";

/**
 * Uploads a buffer to the public "product-images" bucket and returns its
 * public URL. Requires the bucket to exist and be public — see README
 * "Setting up photo uploads" for the one-time Supabase Storage step.
 */
export async function uploadProductImage(path: string, buffer: Buffer, contentType: string): Promise<string> {
  const supabase = createServiceSupabaseClient();

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Could not upload image: ${error.message}`);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
