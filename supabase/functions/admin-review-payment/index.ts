import { corsHeaders, json } from "../_shared/cors.ts";
import { requireProfile } from "../_shared/auth.ts";
import { adminIds } from "../_shared/supabase.ts";
import { sendTelegramMessage } from "../_shared/telegram.ts";

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

    const { data: requester } = await supabase
      .from("profiles")
      .select("telegram_id, language")
      .eq("id", payment.user_id)
      .maybeSingle();

    if (requester?.telegram_id) {
      try {
        await sendTelegramMessage(
          requester.telegram_id,
          reviewMessage(requester.language ?? "am", action, payment.upgrade_type),
        );
      } catch (messageError) {
        console.error("Payment review Telegram notification failed", messageError);
      }
    }

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Review failed" }, 403);
  }
});

function reviewMessage(language: string, action: "approve" | "reject", upgradeType: string) {
  if (language === "en") {
    return action === "approve"
      ? [
          `Your ${upgradeLabel(upgradeType, "en")} request has been approved.`,
          "The upgrade has now been applied to your account or listing.",
          "",
          "Thank you for using Tossa Gebaya.",
        ].join("\n")
      : [
          `Your ${upgradeLabel(upgradeType, "en")} request was not approved.`,
          "Please contact support if you think this was a mistake or need help with your payment. contact our customer support @tossa_gebeya_support",
        ].join("\n");
  }

  return action === "approve"
    ? [
        `✅ የ${upgradeLabel(upgradeType, "am")} ጥያቄዎ ጸድቋል!`,
        "ማሻሻያው በማስታወቂያዎ ላይ ተተግብሯል።",
        "ጦሳ ገበያን ስለመረጡ እናመሰግናለን።"
      ].join("\n")
    : [
        `❌ የ${upgradeLabel(upgradeType, "am")} ጥያቄዎ አልጸደቀም።`,
        "ለእርዳታ የደንበኞች ድጋፍን በ @tossa_gebeya_support ያግኙ። "
      ].join("\n");
}

function upgradeLabel(upgradeType: string, language: "am" | "en") {
  const labels = {
    am: {
      extend: "7 ቀን ማራዘሚያ",
      boost: "ለ3 ቀናት ከላይ ማሳየት",
      overflow: "1 ተጨማሪ ፖስት",
    },
    en: {
      extend: "7-day extension",
      boost: "3-day feed boost",
      overflow: "1 extra post",
    },
  };

  return labels[language][upgradeType as keyof typeof labels.en] ?? upgradeType;
}
