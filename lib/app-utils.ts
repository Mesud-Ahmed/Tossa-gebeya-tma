import { ZodError } from "zod";
import { localizeKnownError, t } from "./i18n";
import { getStoragePublicUrl } from "./supabase";
import type { Language, Listing, UpgradeType } from "./types";

export function withImageUrls(rows: Listing[]): Listing[] {
  return rows.map((listing) => ({
    ...listing,
    listing_images: listing.listing_images?.map((image) => ({
      ...image,
      public_url: getStoragePublicUrl("listing-images", image.storage_path),
    })),
  }));
}

export function formatError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(". ");
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function formatLocalizedError(error: unknown, language: Language, fallback: string) {
  const message = formatError(error, fallback);
  return localizeKnownError(language, message);
}

export function upgradeLabel(type: UpgradeType, language: Language = "en") {
  if (type === "extend") return t(language, "extend");
  if (type === "boost") return t(language, "boost");
  return t(language, "overflow");
}
