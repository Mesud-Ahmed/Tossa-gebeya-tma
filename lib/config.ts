export function parseAdminTelegramIds(raw: string) {
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export const appConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  functionsUrl:
    process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "",
  payment: {
    telebirrName:
      process.env.NEXT_PUBLIC_TELEBIRR_ACCOUNT_NAME ?? "Tossa Gebaya",
    telebirrNumber:
      process.env.NEXT_PUBLIC_TELEBIRR_ACCOUNT_NUMBER ?? "Set in .env.local",
    cbeName: process.env.NEXT_PUBLIC_CBE_ACCOUNT_NAME ?? "Tossa Gebaya",
    cbeNumber:
      process.env.NEXT_PUBLIC_CBE_ACCOUNT_NUMBER ?? "Set in .env.local",
  },
  adminTelegramIds: parseAdminTelegramIds(
    process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_IDS ?? "",
  ),
};

export function assertPublicConfig() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
}
