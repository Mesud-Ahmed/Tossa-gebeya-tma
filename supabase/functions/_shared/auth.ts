import { adminClient } from "./supabase.ts";
import { verifyTelegramInitData } from "./telegram.ts";

export async function requireProfile(req: Request) {
  const initData = req.headers.get("x-telegram-init-data") ?? "";
  const telegramUser = await verifyTelegramInitData(initData);
  const supabase = adminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_id", String(telegramUser.id))
    .single();
  if (error) throw error;
  return { supabase, profile, telegramId: String(telegramUser.id) };
}
