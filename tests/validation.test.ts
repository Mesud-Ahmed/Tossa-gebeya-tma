import { describe, expect, it } from "vitest";
import { PHONE_REGEX, boostUntil, canUseFreePost, isCurrentlyBoosted, listingInputSchema, nextExpiryDate, upgradeAmounts } from "../lib/validation";

describe("listing validation", () => {
  it("accepts Ethiopian mobile phone numbers", () => {
    expect(PHONE_REGEX.test("0912345678")).toBe(true);
    expect(PHONE_REGEX.test("+251912345678")).toBe(true);
    expect(PHONE_REGEX.test("0812345678")).toBe(false);
  });

  it("requires item price and category", () => {
    const parsed = listingInputSchema.safeParse({
      type: "item",
      title: "Phone",
      location: "Dessie",
      phone: "0912345678",
      imagePaths: []
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least one item image", () => {
    const parsed = listingInputSchema.safeParse({
      type: "item",
      title: "Phone",
      category: "electronics",
      price: 1000,
      location: "Dessie",
      phone: "0912345678",
      imagePaths: []
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts item listings with an image", () => {
    const parsed = listingInputSchema.safeParse({
      type: "item",
      title: "Phone",
      category: "electronics",
      price: 1000,
      location: "Dessie",
      phone: "0912345678",
      imagePaths: ["owner/photo.jpg"]
    });

    expect(parsed.success).toBe(true);
  });

  it("keeps jobs text-only", () => {
    const parsed = listingInputSchema.safeParse({
      type: "job",
      title: "Cashier",
      category: "hospitality",
      description: "Friendly cashier needed",
      location: "Dessie",
      phone: "0912345678",
      imagePaths: ["jobs/nope.jpg"]
    });

    expect(parsed.success).toBe(false);
  });
});

describe("monetization rules", () => {
  it("allows only three free active posts per week", () => {
    expect(canUseFreePost(0)).toBe(true);
    expect(canUseFreePost(2)).toBe(true);
    expect(canUseFreePost(3)).toBe(false);
  });

  it("uses configured upgrade prices", () => {
    expect(upgradeAmounts.extend).toBe(25);
    expect(upgradeAmounts.boost).toBe(50);
    expect(upgradeAmounts.overflow).toBe(25);
  });

  it("computes future expiry windows", () => {
    const base = new Date("2026-07-07T00:00:00.000Z");
    expect(nextExpiryDate(base)).toBe("2026-07-14T00:00:00.000Z");
    expect(boostUntil(base)).toBe("2026-07-10T00:00:00.000Z");
  });

  it("detects active boosts", () => {
    expect(isCurrentlyBoosted({ is_boosted: true, boosted_until: new Date(Date.now() + 1000).toISOString() })).toBe(true);
    expect(isCurrentlyBoosted({ is_boosted: true, boosted_until: new Date(Date.now() - 1000).toISOString() })).toBe(false);
  });
});
