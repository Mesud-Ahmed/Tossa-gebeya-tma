import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export function adminClient() {
  const url =
    Deno.env.get("SUPABASE_URL") ??
    Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ??
    "";
  const serviceKey =
    Deno.env.get("SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "";
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function adminIds() {
  return (
    Deno.env.get("TELEGRAM_ADMIN_IDS") ??
    Deno.env.get("NEXT_PUBLIC_ADMIN_TELEGRAM_IDS") ??
    ""
  )
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}
