import { corsHeaders, json } from "../_shared/cors.ts";
import { requireProfile } from "../_shared/auth.ts";
import { adminIds } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { supabase, telegramId } = await requireProfile(req);
    if (!adminIds().includes(telegramId)) throw new Error("Admin only");

    const { data, error } = await supabase
      .from("payment_requests")
      .select("*, listings(*), profiles(*)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw error;

    const payments = await Promise.all(
      (data ?? []).map(async (payment) => {
        const { data: signed } = await supabase.storage
          .from("payment-screenshots")
          .createSignedUrl(payment.screenshot_path, 60 * 10);
        return { ...payment, screenshot_url: signed?.signedUrl ?? null };
      })
    );

    return json({ payments });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Admin list failed" }, 403);
  }
});
