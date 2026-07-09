import { corsHeaders, json } from "../_shared/cors.ts";
import { requireProfile } from "../_shared/auth.ts";
import { upgradeAmounts } from "../_shared/rules.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { upgradeType, listingId, screenshotPath } = await req.json();
    if (!["extend", "boost", "overflow"].includes(upgradeType)) throw new Error("Invalid upgrade");
    if (!screenshotPath) throw new Error("Screenshot is required");

    const { supabase, profile } = await requireProfile(req);

    if (upgradeType !== "overflow") {
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("id")
        .eq("id", listingId)
        .eq("owner_id", profile.id)
        .single();
      if (listingError || !listing) throw new Error("Listing not found");
    }

    const { data, error } = await supabase
      .from("payment_requests")
      .insert({
        user_id: profile.id,
        listing_id: upgradeType === "overflow" ? null : listingId,
        upgrade_type: upgradeType,
        amount_etb: upgradeAmounts[upgradeType as keyof typeof upgradeAmounts],
        screenshot_path: screenshotPath
      })
      .select()
      .single();

    if (error) throw error;
    return json({ paymentRequest: data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Payment request failed" }, 400);
  }
});
