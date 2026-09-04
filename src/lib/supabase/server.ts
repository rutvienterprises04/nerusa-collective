import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key — bypasses RLS.
// NEVER import this from a "use client" component or expose the key to the browser.
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill them in."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
