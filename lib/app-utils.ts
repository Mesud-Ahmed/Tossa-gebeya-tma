import { ZodError } from "zod";
import { getStoragePublicUrl } from "./supabase";
import type { Listing, UpgradeType } from "./types";

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

export function upgradeLabel(type: UpgradeType) {
  if (type === "extend") return "Extend ad";
  if (type === "boost") return "Boost ad";
  return "Extra post";
}
