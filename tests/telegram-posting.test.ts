import { describe, expect, it } from "vitest";
import {
  buildListingPreviewText,
  buildListingPreviewUrl,
} from "../lib/telegram-posting";

describe("listing preview helpers", () => {
  it("formats a clean Telegram preview card", () => {
    const text = buildListingPreviewText(
      {
        id: "listing-123",
        type: "item",
        title: "Wooden Bed",
        location: "Arada, Dessie",
        price: 56000,
      },
      "https://app.example/listing?listing=listing-123",
    );

    expect(text).toContain("📌 [የሚሸጥ / For Sale] Wooden Bed");
    expect(text).toContain("📍 Arada, Dessie");
    expect(text).toContain("💰 56,000 ETB");
    expect(text).toContain("https://app.example/listing?listing=listing-123");
  });

  it("builds a Telegram Mini App deep link when a bot username is provided", () => {
    expect(
      buildListingPreviewUrl("listing-123", {
        botUsername: "tossa_gebeya_bot",
      }),
    ).toBe("https://t.me/tossa_gebeya_bot?startapp=listing_listing-123");
  });
});
