import { corsHeaders, json } from "../_shared/cors.ts";
import { requireProfile } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { listingId } = await req.json();
    const { supabase, profile } = await requireProfile(req);

    const { error } = await supabase
      .from("listings")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", listingId)
      .eq("owner_id", profile.id);
    if (error) throw error;

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Delete failed" }, 400);
  }
});
