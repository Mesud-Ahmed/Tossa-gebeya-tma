"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Star, X } from "lucide-react";
import { categoryLabel } from "@/lib/categories";
import { t } from "@/lib/i18n";
import { formatCurrency, formatEthiopianDate } from "@/lib/app-utils";
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
    return (
      <p className="py-12 text-center text-sm text-ink/60">
        {t(language, "empty")}
      </p>
    );
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
            {listing.type === "item" && (
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-mist">
                {listing.listing_images?.[0]?.public_url && (
                  <img
                    className="h-full w-full object-cover"
                    src={listing.listing_images[0].public_url}
                    alt=""
                  />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="line-clamp-2 text-base font-black">
                  {listing.title}
                </h2>
                {isCurrentlyBoosted(listing) && (
                  <Star className="shrink-0 fill-gold text-gold" size={18} />
                )}
              </div>
              <p className="mt-1 text-sm text-ink/65">{listing.location}</p>
              <p className="mt-2 font-black text-leaf">
                {listing.type === "item"
                  ? formatCurrency(listing.price)
                  : listing.salary
                    ? formatCurrency(listing.salary)
                    : t(language, "open")}
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
  const images = useMemo(
    () =>
      listing.type === "item"
        ? [
            ...(listing.listing_images?.filter((image) => image.public_url) ??
              []),
          ].sort((a, b) => a.sort_order - b.sort_order)
        : [],
    [listing],
  );
  const [activeImage, setActiveImage] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveImage(0);
    carouselRef.current?.scrollTo({ left: 0 });
  }, [listing.id]);

  function scrollToImage(index: number) {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollTo({
      left: carousel.clientWidth * index,
      behavior: "smooth",
    });
    setActiveImage(index);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/35"
      onClick={onClose}
    >
      <section
        className="relative max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/5 text-ink transition hover:bg-black/10"
          onClick={onClose}
          type="button"
          aria-label={t(language, "close")}
        >
          <X size={18} />
        </button>
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-black/20" />
        {images.length > 0 && (
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex snap-x snap-mandatory overflow-x-auto rounded-lg scroll-smooth"
              onScroll={(event) => {
                const target = event.currentTarget;
                const nextIndex = Math.round(
                  target.scrollLeft / Math.max(target.clientWidth, 1),
                );
                setActiveImage(
                  Math.min(Math.max(nextIndex, 0), images.length - 1),
                );
              }}
            >
              {images.map((image) => (
                <button
                  key={image.id}
                  className="relative grid h-52 min-w-full snap-center place-items-center overflow-hidden bg-mist"
                  type="button"
                  onClick={() =>
                    image.public_url && onImagePreview(image.public_url)
                  }
                >
                  <img
                    className="h-full w-full object-cover"
                    src={image.public_url}
                    alt=""
                  />
                  <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow">
                    <Eye size={18} />
                  </span>
                </button>
              ))}
            </div>
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
                      scrollToImage(index);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <h2 className="mt-4 text-2xl font-black">{listing.title}</h2>
        <p className="mt-1 text-sm text-ink/60">{listing.location}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
          {listing.description || t(language, "noDescription")}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a
            className="grid h-12 place-items-center rounded-lg bg-leaf font-black text-white"
            href={`tel:${listing.phone}`}
          >
            {t(language, "call")}
          </a>
          {listing.telegram_username ? (
            <a
              className="grid h-12 place-items-center rounded-lg border border-black/10 bg-white font-black text-ink"
              href={`https://t.me/${listing.telegram_username}`}
              target="_blank"
              rel="noreferrer"
            >
              {t(language, "telegram")}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
