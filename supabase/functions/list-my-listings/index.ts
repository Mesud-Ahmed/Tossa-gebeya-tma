import { corsHeaders, json } from "../_shared/cors.ts";
import { requireProfile } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { supabase, profile } = await requireProfile(req);
    const { data, error } = await supabase
      .from("listings")
      .select("*, listing_images(*)")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return json({ listings: data ?? [] });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "List failed" }, 400);
  }
});
