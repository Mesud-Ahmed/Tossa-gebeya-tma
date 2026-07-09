import { corsHeaders, json } from "../_shared/cors.ts";
import { requireProfile } from "../_shared/auth.ts";
import { adminIds } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { supabase, telegramId } = await requireProfile(req);
    if (!adminIds().includes(telegramId)) throw new Error("Admin only");

    const { paymentRequestId, action } = await req.json();
    if (!["approve", "reject"].includes(action)) throw new Error("Invalid action");

    const { data: payment, error: paymentError } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("id", paymentRequestId)
      .eq("status", "pending")
      .single();
    if (paymentError) throw paymentError;

    if (action === "approve") {
      if (payment.upgrade_type === "extend" && payment.listing_id) {
        const { data: listing, error } = await supabase.from("listings").select("expires_at").eq("id", payment.listing_id).single();
        if (error) throw error;
        const base = Math.max(new Date(listing.expires_at).getTime(), Date.now());
        const expiresAt = new Date(base + 7 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("listings").update({ status: "active", expires_at: expiresAt }).eq("id", payment.listing_id);
      }

      if (payment.upgrade_type === "boost" && payment.listing_id) {
        const boostedUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("listings").update({ is_boosted: true, boosted_until: boostedUntil }).eq("id", payment.listing_id);
      }

      if (payment.upgrade_type === "overflow") {
        await supabase.from("extra_post_slots").insert({
          user_id: payment.user_id,
          source_payment_request_id: payment.id
        });
      }
    }

    await supabase
      .from("payment_requests")
      .update({ status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", payment.id);

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Review failed" }, 403);
  }
});
