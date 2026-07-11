import { describe, expect, it } from "vitest";
import {
  buildTelegramCheckString,
  computeTelegramCheckHash,
} from "../lib/telegram-auth";
import { createHmac } from "node:crypto";

describe("telegram initData hashing", () => {
  it("matches Telegram's HMAC-SHA256 signature format", async () => {
    const params = new URLSearchParams(
      "auth_date=1720000000&user=%7B%22id%22%3A5040963728%7D",
    );
    const checkString = buildTelegramCheckString(params);
    const botToken = "123456789:ABCDEF";
    const secretKey = createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();
    const expected = createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    const actual = await computeTelegramCheckHash(checkString, botToken);
    expect(actual).toBe(expected);
  });
});
