import type { AppSession } from "./types";
import { appConfig } from "./config";
import { functionUrl } from "./function-url";

export function initTelegram() {
  if (typeof window === "undefined") return "";
  const webApp = window.Telegram?.WebApp;
  webApp?.ready();
  webApp?.expand();
  return webApp?.initData ?? "";
}

export function hasTelegramHash(initData: string) {
  return new URLSearchParams(initData).has("hash");
}

export async function verifyTelegram(initData: string): Promise<AppSession> {
  const endpoint = functionUrl("verify-telegram-auth");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: appConfig.supabaseAnonKey,
      Authorization: `Bearer ${appConfig.supabaseAnonKey}`,
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Telegram authentication failed");
  }

  return response.json();
}
