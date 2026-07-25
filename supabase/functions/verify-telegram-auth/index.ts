import { corsHeaders, json } from "../_shared/cors.ts";
import { adminIds, adminClient } from "../_shared/supabase.ts";
import { verifyTelegramInitData } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const { initData } = await req.json();
    const user = await verifyTelegramInitData(initData);
    const supabase = adminClient();

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          telegram_id: String(user.id),
          username: user.username ?? null,
          first_name: user.first_name ?? null,
          last_name: user.last_name ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "telegram_id" },
      )
      .select()
      .single();

    if (error) throw error;

    return json({
      profile: {
        ...data,
        telegram_id: String(data.telegram_id),
        is_admin: adminIds().includes(String(user.id)),
      },
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Auth failed" },
      401,
    );
  }
});
