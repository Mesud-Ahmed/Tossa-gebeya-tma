import { appConfig } from "./config";

export function functionUrl(name: string) {
  const base = appConfig.functionsUrl || appConfig.supabaseUrl;
  const cleanBase = base.replace(/\/$/, "").replace(/\/functions\/v1$/, "");
  return `${cleanBase}/functions/v1/${name}`;
}
