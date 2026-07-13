import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { sendTelegramMessage } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = adminClient();
  const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, profiles!listings_owner_id_fkey(telegram_id, language)")
    .eq("status", "active")
    .is("warned_at", null)
    .gte("expires_at", start)
    .lt("expires_at", end);

  if (error) return json({ error: error.message }, 500);

  for (const listing of data ?? []) {
    const telegramId = (listing as any).profiles?.telegram_id;
    const language = (listing as any).profiles?.language ?? "am";
    if (!telegramId) continue;
    await sendTelegramMessage(telegramId, expiryMessage(language, listing.title));
    await supabase.from("listings").update({ warned_at: new Date().toISOString() }).eq("id", listing.id);
  }

  return json({ ok: true, count: data?.length ?? 0 });
});

function expiryMessage(language: string, title: string) {
  if (language === "en") {
    return `Your Tossa Gebaya post "${title}" will expire in about 2 days.`;
  }

  return `የጦሳ ገበያ ማስታወቂያዎ "${title}" በ2 ቀናት ገደማ ውስጥ ያበቃል።`;
}
