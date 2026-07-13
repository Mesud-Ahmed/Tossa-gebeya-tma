import { corsHeaders, json } from "../_shared/cors.ts";
import { requireProfile } from "../_shared/auth.ts";
import { upgradeAmounts } from "../_shared/rules.ts";
import { sendTelegramMessage } from "../_shared/telegram.ts";

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

    try {
      await sendTelegramMessage(
        profile.telegram_id,
        paymentRequestMessage(profile.language ?? "am", upgradeType, upgradeAmounts[upgradeType as keyof typeof upgradeAmounts]),
      );
    } catch (messageError) {
      console.error("Payment request Telegram notification failed", messageError);
    }

    return json({ paymentRequest: data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Payment request failed" }, 400);
  }
});

function paymentRequestMessage(language: string, upgradeType: string, amount: number) {
  if (language === "en") {
    return [
      "Your paid upgrade request has been received.",
      "",
      `Package: ${upgradeLabel(upgradeType, "en")}`,
      `Amount: ${amount} ETB`,
      "",
      "An admin will review your payment screenshot and apply the upgrade after confirmation. Thank you for using Tossa Gebaya.",
    ].join("\n");
  }

  return [
    "የሚከፈልበት የማሻሻያ ጥያቄዎ ተቀብለናል።",
    "",
    `ፓኬጅ: ${upgradeLabel(upgradeType, "am")}`,
    `መጠን: ${amount} ETB`,
    "",
    "አስተዳዳሪ የክፍያ ስክሪንሾትዎን ካረጋገጠ በኋላ ማሻሻያው ይተገበራል። ጦሳ ገበያን ስለተጠቀሙ እናመሰግናለን።",
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
