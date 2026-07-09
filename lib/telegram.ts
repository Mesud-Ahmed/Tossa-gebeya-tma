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

export async function verifyTelegram(initData: string): Promise<AppSession> {
  const endpoint = functionUrl("verify-telegram-auth");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: appConfig.supabaseAnonKey,
      Authorization: `Bearer ${appConfig.supabaseAnonKey}`
    },
    body: JSON.stringify({ initData })
  });

  if (!response.ok) {
    throw new Error("Telegram authentication failed");
  }

  return response.json();
}
