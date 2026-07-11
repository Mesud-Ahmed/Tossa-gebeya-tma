import {
  buildTelegramCheckString,
  computeTelegramCheckHash,
} from "../../../lib/telegram-auth.ts";

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
      body: JSON.stringify({ chat_id: chatId, text }),
    },
  );
  if (!response.ok) throw new Error(await response.text());
}
