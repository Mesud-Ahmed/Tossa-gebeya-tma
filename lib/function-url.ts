import { appConfig } from "./config";
import { normalizeSupabaseBaseUrl } from "./supabase-url";

export function functionUrl(name: string) {
  const base = appConfig.functionsUrl || appConfig.supabaseUrl;
  const cleanBase = normalizeSupabaseBaseUrl(base);
  return `${cleanBase}/functions/v1/${name}`;
}
