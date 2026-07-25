import {
  buildTelegramCheckString,
  computeTelegramCheckHash,
} from "../../../lib/telegram-auth.ts";
import {
  buildListingPreviewText,
  buildListingPreviewUrl,
  normalizeTelegramChatId,
} from "../../../lib/telegram-posting.ts";

export async function verifyTelegramInitData(initData: string) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("Missing TELEGRAM_BOT_TOKEN");

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Missing Telegram hash");
  params.delete("hash");

  const checkString = buildTelegramCheckString(params);
  const calculated = await computeTelegramCheckHash(checkString, botToken);

  if (calculated !== hash) throw new Error("Invalid Telegram signature");

  const authDate = Number(params.get("auth_date") ?? "0") * 1000;
  if (Date.now() - authDate > 24 * 60 * 60 * 1000)
    throw new Error("Telegram session expired");

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("Missing Telegram user");
  return JSON.parse(userRaw) as {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("Missing TELEGRAM_BOT_TOKEN");
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: normalizeTelegramChatId(chatId), text }),
    },
  );
  if (!response.ok) throw new Error(await response.text());
}

export function getTelegramGroupChatId() {
  return (
    Deno.env.get("TELEGRAM_GROUP_CHAT_ID") ??
    Deno.env.get("NEXT_PUBLIC_TELEGRAM_GROUP_CHAT_ID") ??
    Deno.env.get("NEXT_PUBLIC_TELEGRAM_GROUP_URL") ??
    ""
  );
}

export async function sendListingPreviewToGroup(listing: {
  id: string;
  type: "item" | "job";
  title: string;
  location: string;
  price?: number | null;
  salary?: number | null;
}) {
  const chatId = getTelegramGroupChatId();
  if (!chatId) return false;

  const appUrl =
    Deno.env.get("NEXT_PUBLIC_MINI_APP_URL") ??
    Deno.env.get("NEXT_PUBLIC_APP_URL") ??
    "";
  const botUsername =
    Deno.env.get("TELEGRAM_BOT_USERNAME") ??
    Deno.env.get("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME") ??
    "";
  const link = buildListingPreviewUrl(listing.id, { appUrl, botUsername });
  const text = buildListingPreviewText(listing, link);

  await sendTelegramMessage(chatId, text);
  return true;
}
