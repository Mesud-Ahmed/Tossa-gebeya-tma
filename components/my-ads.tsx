"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { appConfig } from "@/lib/config";
import { categoryLabel } from "@/lib/categories";
import { t } from "@/lib/i18n";
import type { Language, Listing, UpgradeType } from "@/lib/types";

export function MyAds({
  busy,
  listings,
  language,
  onDelete,
  onRequestUpgrade,
}: {
  busy: boolean;
  listings: Listing[];
  language: Language;
  onDelete: (listing: Listing) => void;
  onRequestUpgrade: (formData: FormData) => void;
}) {
  const [upgradeType, setUpgradeType] = useState<UpgradeType>("extend");
  const needsListing = upgradeType !== "overflow";

  return (
    <section className="space-y-4 p-4">
      <form
        className="space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onRequestUpgrade(new FormData(event.currentTarget));
        }}
      >
        <h2 className="text-lg font-black">Paid upgrades</h2>
        <p className="text-sm leading-5 text-ink/65">
          {language === "am"
            ? "ማስታወቂያዎን ለ 7 ቀን ማራዘም፣ ለ 3 ቀን ከላይ ማሳየት፣ ወይም አንድ ተጨማሪ ፖስት መግዛት ይችላሉ።"
            : "Extend an ad for 7 days, boost it to the top for 3 days, or buy one extra post beyond the weekly free limit."}
        </p>
        <select
          className="h-12 w-full rounded-md border border-black/10 bg-mist px-3 font-bold"
          name="upgradeType"
          value={upgradeType}
          onChange={(event) => setUpgradeType(event.target.value as UpgradeType)}
        >
          <option value="extend">{t(language, "extend")} - 25 ETB</option>
          <option value="boost">{t(language, "boost")} - 50 ETB</option>
          <option value="overflow">{t(language, "overflow")} - 25 ETB</option>
        </select>
        {needsListing && (
          <select className="h-12 w-full rounded-md border border-black/10 px-3" name="listingId" required>
            <option value="">{language === "am" ? "ማስታወቂያ ይምረጡ" : "Choose an ad"}</option>
            {listings
              .filter((listing) => listing.status === "active")
              .map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
          </select>
        )}
        {!needsListing && <input type="hidden" name="listingId" value="" />}
        <div className="rounded-md bg-mist p-3 text-xs leading-5">
          Telebirr: {appConfig.payment.telebirrName} / {appConfig.payment.telebirrNumber}
          <br />
          CBE: {appConfig.payment.cbeName} / {appConfig.payment.cbeNumber}
        </div>
        <input className="w-full text-sm" name="receipt" type="file" accept="image/*" required />
        <button className="h-11 w-full rounded-lg bg-ember font-black text-white disabled:opacity-60" disabled={busy}>
          {t(language, "submit")}
        </button>
      </form>

      {listings.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink/60">{t(language, "empty")}</p>
      ) : (
        listings.map((listing) => (
          <article key={listing.id} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{listing.title}</h3>
                <p className="mt-2 text-xs font-bold text-leaf">
                  {categoryLabel(listing.type, listing.category, language)}
                  {listing.type === "item" && listing.price ? ` - ${listing.price} ETB` : ""}
                  {listing.type === "job" && listing.salary ? ` - ${listing.salary} ETB` : ""}
                </p>
                <p className="text-sm text-ink/60">
                  {listing.status} - expires {new Date(listing.expires_at).toLocaleDateString()}
                </p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600"
                onClick={() => onDelete(listing)}
                aria-label="Delete"
                type="button"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
