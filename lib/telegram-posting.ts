export type ListingPreviewPayload = {
  id: string;
  type: "item" | "job";
  title: string;
  location: string;
  price?: number | null;
  salary?: number | null;
};

export function formatAmount(value: number) {
  return new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildListingPreviewText(
  listing: ListingPreviewPayload,
  link: string,
) {
  const label =
    listing.type === "job" ? "📌 [ስራ / Job]" : "📌 [የሚሸጥ / For Sale]";
  const amount = listing.type === "item" ? listing.price : listing.salary;
  const amountText =
    typeof amount === "number" ? `${formatAmount(amount)} ETB` : "ተጨማሪ መረጃ";

  return [
    `${label} ${listing.title}`,
    `📍 ${listing.location}`,
    "",
    `💰 ${amountText}`,
    "",
    "🔗 ማስታወቂያውን በሙሉ ይመልከቱ / Open in App",
    link,
  ].join("\n");
}

export function buildListingPreviewUrl(
  listingId: string,
  options?: { botUsername?: string; appUrl?: string },
) {
  const botUsername = options?.botUsername?.trim();
  // Many Telegram clients and bot configurations do not reliably support
  // the `?startapp=` deep link parameter. Fall back to posting the bot's
  // public link (which opens the bot chat) so users can tap the bot to
  // open the Mini App from there.
  if (botUsername) {
    return `https://t.me/${botUsername}`;
  }

  const appUrl = options?.appUrl?.trim();
  if (appUrl) {
    const separator = appUrl.includes("?") ? "&" : "?";
    return `${appUrl}${separator}listing=${encodeURIComponent(listingId)}`;
  }

  return `https://t.me/tossa_gebeya_test`;
}

export function normalizeTelegramChatId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const username = parsed.pathname.replace(/^\/+/, "");
      return username ? `@${username}` : "";
    } catch {
      return trimmed;
    }
  }

  return trimmed.startsWith("@") ? trimmed : trimmed;
}
