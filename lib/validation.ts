import { z } from "zod";
import type { Listing, UpgradeType } from "./types";

export const PHONE_REGEX = /^(\+251|0)?9\d{8}$/;

export const listingInputSchema = z
  .object({
    type: z.enum(["item", "job"]),
    title: z.string().trim().min(3).max(80),
    description: z.string().trim().min(5).max(1200).optional(),
    price: z.coerce.number().positive().max(10_000_000).optional(),
    salary: z.coerce.number().positive().max(2_000_000).optional(),
    category: z.string().trim().max(50).optional(),
    location: z.string().trim().min(2).max(80),
    condition: z.string().trim().max(40).optional(),
    jobType: z.string().trim().max(40).optional(),
    phone: z.string().trim().regex(PHONE_REGEX),
    imagePaths: z.array(z.string()).max(4).default([])
  })
  .superRefine((value, ctx) => {
    if (!value.category) {
      ctx.addIssue({ code: "custom", path: ["category"], message: "Category is required" });
    }

    if (value.type === "item") {
      if (!value.price) ctx.addIssue({ code: "custom", path: ["price"], message: "Price is required" });
    }

    if (value.type === "job") {
      if (!value.description) {
        ctx.addIssue({ code: "custom", path: ["description"], message: "Requirements are required" });
      }
      if (value.imagePaths.length > 0) {
        ctx.addIssue({ code: "custom", path: ["imagePaths"], message: "Jobs are text-only" });
      }
    }
  });

export const upgradeAmounts: Record<UpgradeType, number> = {
  extend: 25,
  boost: 50,
  overflow: 25
};

export function isCurrentlyBoosted(listing: Pick<Listing, "is_boosted" | "boosted_until">) {
  return Boolean(
    listing.is_boosted && listing.boosted_until && new Date(listing.boosted_until).getTime() > Date.now()
  );
}

export function canUseFreePost(activeListingsThisWeek: number) {
  return activeListingsThisWeek < 3;
}

export function nextExpiryDate(from = new Date()) {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + 7);
  return expires.toISOString();
}

export function boostUntil(from = new Date()) {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + 3);
  return expires.toISOString();
}
