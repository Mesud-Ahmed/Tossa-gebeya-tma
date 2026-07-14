"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useId, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
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
  const [receiptPreview, setReceiptPreview] = useState("");
  const receiptInputId = useId();
  const needsListing = upgradeType !== "overflow";
  const visibleListings = listings.filter((listing) => listing.status !== "deleted");

  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
  }, [receiptPreview]);

  function handleReceiptChange(event: ChangeEvent<HTMLInputElement>) {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    const file = event.target.files?.[0];
    setReceiptPreview(file ? URL.createObjectURL(file) : "");
  }

  return (
    <section className="space-y-4 p-4">
      <form
        className="space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onRequestUpgrade(new FormData(event.currentTarget));
        }}
      >
        <div>
          <h2 className="text-lg font-black">{t(language, "paidUpgrades")}</h2>
          <p className="mt-1 text-sm leading-5 text-ink/65">{t(language, "upgradeIntro")}</p>
        </div>
        <ul className="space-y-2 rounded-lg bg-mist p-3 text-sm leading-5 text-ink/75">
          <li>
            <span className="font-black">{t(language, "extend")} - 25 ETB:</span> {t(language, "extendBenefit")}
          </li>
          <li>
            <span className="font-black">{t(language, "boost")} - 50 ETB:</span> {t(language, "boostBenefit")}
          </li>
          <li>
            <span className="font-black">{t(language, "overflow")} - 25 ETB:</span> {t(language, "overflowBenefit")}
          </li>
        </ul>
        <label className="block">
          <span className="mb-1 block text-sm font-black text-ink">{t(language, "paidUpgrades")}</span>
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
        </label>
        {needsListing && (
          <label className="block">
            <span className="mb-1 block text-sm font-black text-ink">{t(language, "chooseAd")}</span>
            <select className="h-12 w-full rounded-md border border-black/10 px-3" name="listingId" required>
              <option value="">{t(language, "chooseAd")}</option>
              {listings
                .filter((listing) => listing.status === "active")
                .map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title}
                  </option>
                ))}
            </select>
          </label>
        )}
        {!needsListing && <input type="hidden" name="listingId" value="" />}
        <div className="rounded-md bg-mist p-3 text-xs leading-5">
          <p className="mb-1 font-black text-ink">{t(language, "paymentAccounts")}</p>
          Telebirr: {appConfig.payment.telebirrName} / {appConfig.payment.telebirrNumber}
          <br />
          CBE: {appConfig.payment.cbeName} / {appConfig.payment.cbeNumber}
        </div>
        <div>
          <span className="mb-1 block text-sm font-black text-ink">{t(language, "receipt")}</span>
          <label
            className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-black/20 bg-white p-4 text-center"
            htmlFor={receiptInputId}
          >
            <ImageUp className="text-ember" size={26} />
            <span className="mt-2 text-sm font-black text-ink">{t(language, "receipt")}</span>
            <span className="mt-1 text-xs leading-5 text-ink/60">{t(language, "receiptHelp")}</span>
          </label>
          <input
            className="sr-only"
            id={receiptInputId}
            name="receipt"
            type="file"
            accept="image/*"
            required
            onChange={handleReceiptChange}
          />
          {receiptPreview && (
            <div className="mt-3 h-24 w-24 overflow-hidden rounded-md bg-mist">
              <img className="h-full w-full object-cover" src={receiptPreview} alt={t(language, "receipt")} />
            </div>
          )}
        </div>
        <button className="h-11 w-full rounded-lg bg-ember font-black text-white disabled:opacity-60" disabled={busy}>
          {t(language, "submit")}
        </button>
      </form>

      <h2 className="pt-2 text-xl font-black">{t(language, "myListingsTitle")}</h2>
      {visibleListings.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink/60">{t(language, "empty")}</p>
      ) : (
        visibleListings.map((listing) => (
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
                  {t(language, "status")}: {listing.status} - {t(language, "expires")}{" "}
                  {new Date(listing.expires_at).toLocaleDateString()}
                </p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600"
                onClick={() => onDelete(listing)}
                aria-label={t(language, "delete")}
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
