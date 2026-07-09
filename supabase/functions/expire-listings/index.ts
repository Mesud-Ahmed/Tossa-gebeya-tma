import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = adminClient();
  const { error } = await supabase
    .from("listings")
    .update({ status: "expired", is_boosted: false })
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
