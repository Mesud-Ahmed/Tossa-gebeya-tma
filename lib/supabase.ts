import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";
import { normalizeSupabaseBaseUrl } from "./supabase-url";

export const supabase = createClient(normalizeSupabaseBaseUrl(appConfig.supabaseUrl) || "http://localhost:54321", appConfig.supabaseAnonKey || "demo-anon-key", {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export function getStoragePublicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
