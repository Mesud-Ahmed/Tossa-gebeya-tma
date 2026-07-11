import { describe, expect, it } from "vitest";
import { parseAdminTelegramIds } from "../lib/config";

describe("admin telegram id parsing", () => {
  it("parses comma-separated ids and trims whitespace", () => {
    expect(parseAdminTelegramIds("5040963728, 1234567890")).toEqual([
      "5040963728",
      "1234567890",
    ]);
  });

  it("returns an empty list when no ids are configured", () => {
    expect(parseAdminTelegramIds("  , , ")).toEqual([]);
  });
});
