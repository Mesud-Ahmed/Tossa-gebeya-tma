"use client";

import { useState } from "react";
import { Eye, Image as ImageIcon, Megaphone, Star } from "lucide-react";
import { categoryLabel } from "@/lib/categories";
import { t } from "@/lib/i18n";
import type { Language, Listing } from "@/lib/types";
import { isCurrentlyBoosted } from "@/lib/validation";

export function ListingGrid({
  listings,
  language,
  onSelect,
}: {
  listings: Listing[];
  language: Language;
  onSelect: (listing: Listing) => void;
}) {
  if (listings.length === 0) {
    return <p className="py-12 text-center text-sm text-ink/60">{t(language, "empty")}</p>;
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <button
          key={listing.id}
          className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm ${isCurrentlyBoosted(listing) ? "border-gold ring-2 ring-gold/30" : "border-black/10"}`}
          onClick={() => onSelect(listing)}
          type="button"
        >
          <div className="flex gap-3">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-mist">
              {listing.listing_images?.[0]?.public_url ? (
                <img className="h-full w-full object-cover" src={listing.listing_images[0].public_url} alt="" />
              ) : (
                <Megaphone className="text-ink/35" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="line-clamp-2 text-base font-black">{listing.title}</h2>
                {isCurrentlyBoosted(listing) && <Star className="shrink-0 fill-gold text-gold" size={18} />}
              </div>
              <p className="mt-1 text-sm text-ink/65">{listing.location}</p>
              <p className="mt-2 font-black text-leaf">
                {listing.type === "item" ? `${listing.price ?? "-"} ETB` : listing.salary ? `${listing.salary} ETB` : t(language, "open")}
              </p>
              {listing.category && (
                <p className="mt-1 text-xs font-bold text-ink/45">
                  {categoryLabel(listing.type, listing.category, language)}
                </p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ListingSheet({
  listing,
  language,
  onImagePreview,
  onClose,
}: {
  listing: Listing;
  language: Language;
  onImagePreview: (src: string) => void;
  onClose: () => void;
}) {
  const username = listing.telegram_username?.replace("@", "");
  const images = listing.listing_images?.length ? listing.listing_images : [{ id: "blank", public_url: "" } as any];
  const [activeImage, setActiveImage] = useState(0);
  const image = images[Math.min(activeImage, images.length - 1)];

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/35" onClick={onClose}>
      <section
        className="max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-black/20" />
        <div className="relative">
          <button
            className="relative grid h-52 w-full place-items-center overflow-hidden rounded-lg bg-mist"
            type="button"
            onClick={() => image.public_url && onImagePreview(image.public_url)}
          >
            {image.public_url ? (
              <>
                <img className="h-full w-full object-cover" src={image.public_url} alt="" />
                <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow">
                  <Eye size={18} />
                </span>
              </>
            ) : (
              <ImageIcon className="text-ink/35" />
            )}
          </button>
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2 py-1">
              {images.map((dotImage, index) => (
                <button
                  key={dotImage.id}
                  className={`h-2 w-2 rounded-full ${index === activeImage ? "bg-white" : "bg-white/45"}`}
                  type="button"
                  aria-label={`${t(language, "photo")} ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveImage(index);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <h2 className="mt-4 text-2xl font-black">{listing.title}</h2>
        <p className="mt-1 text-sm text-ink/60">{listing.location}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{listing.description || t(language, "noDescription")}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <a className="grid h-12 place-items-center rounded-lg bg-leaf font-black text-white" href={`tel:${listing.phone}`}>
            {t(language, "call")}
          </a>
          <a className="grid h-12 place-items-center rounded-lg bg-ember font-black text-white" href={username ? `https://t.me/${username}` : "#"}>
            {t(language, "telegram")}
          </a>
        </div>
      </section>
    </div>
  );
}
