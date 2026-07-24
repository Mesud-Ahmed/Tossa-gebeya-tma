import { ZodError } from "zod";
import { localizeKnownError, t } from "./i18n";
import { getStoragePublicUrl } from "./supabase";
import { toEthiopian } from "ethiopian-calendar-new";
import type { Language, Listing, UpgradeType } from "./types";

const ethiopianMonths = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታህሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ",
];

export function withImageUrls(rows: Listing[]): Listing[] {
  return rows.map((listing) => ({
    ...listing,
    listing_images: listing.listing_images?.map((image) => ({
      ...image,
      public_url: getStoragePublicUrl("listing-images", image.storage_path),
    })),
  }));
}

export function formatEthiopianDate(
  value: string | number | Date | null | undefined,
) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const { year, month, day } = toEthiopian(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  return `${ethiopianMonths[month - 1]} ${day}, ${year}`;
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "-";
  return `${new Intl.NumberFormat("en-US").format(value)} ETB`;
}

export function formatError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(". ");
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function formatLocalizedError(
  error: unknown,
  language: Language,
  fallback: string,
) {
  const message = formatError(error, fallback);
  return localizeKnownError(language, message);
}

export function upgradeLabel(type: UpgradeType, language: Language = "en") {
  if (type === "extend") return t(language, "extend");
  if (type === "boost") return t(language, "boost");
  return t(language, "overflow");
}
