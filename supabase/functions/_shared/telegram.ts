export async function verifyTelegramInitData(initData: string) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("Missing TELEGRAM_BOT_TOKEN");

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Missing Telegram hash");
  params.delete("hash");

  const pairs = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const encoder = new TextEncoder();
  const secret = await crypto.subtle.importKey("raw", encoder.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const secretBytes = await crypto.subtle.sign("HMAC", secret, encoder.encode(botToken));
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(pairs));
  const calculated = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

  if (calculated !== hash) throw new Error("Invalid Telegram signature");

  const authDate = Number(params.get("auth_date") ?? "0") * 1000;
  if (Date.now() - authDate > 24 * 60 * 60 * 1000) throw new Error("Telegram session expired");

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("Missing Telegram user");
  return JSON.parse(userRaw) as { id: number; username?: string; first_name?: string; last_name?: string };
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new Error("Missing TELEGRAM_BOT_TOKEN");
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!response.ok) throw new Error(await response.text());
}
