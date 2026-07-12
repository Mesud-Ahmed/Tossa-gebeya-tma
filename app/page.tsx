"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Eye,
  Filter,
  Image as ImageIcon,
  Languages,
  LoaderCircle,
  Megaphone,
  Plus,
  ReceiptText,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { ZodError } from "zod";
import { appConfig, assertPublicConfig } from "@/lib/config";
import { categoriesFor, categoryLabel } from "@/lib/categories";
import { functionUrl } from "@/lib/function-url";
import { t } from "@/lib/i18n";
import { compressListingImage } from "@/lib/images";
import { supabase, getStoragePublicUrl } from "@/lib/supabase";
import { hasTelegramHash, initTelegram, verifyTelegram } from "@/lib/telegram";
import type {
  AppSession,
  Language,
  Listing,
  ListingType,
  PaymentRequest,
  UpgradeType,
} from "@/lib/types";
import {
  isCurrentlyBoosted,
  listingInputSchema,
  upgradeAmounts,
} from "@/lib/validation";

type View = "feed" | "post" | "my-ads" | "admin";
type Toast = { type: "success" | "error"; title: string; message: string } | null;

const demoSession: AppSession = {
  initData: "demo",
  profile: {
    id: "00000000-0000-0000-0000-000000000001",
    telegram_id: "demo",
    username: "demo_user",
    first_name: "Demo",
    last_name: null,
    language: "am",
    is_admin: true,
  },
};

export default function Home() {
  const [session, setSession] = useState<AppSession | null>(null);
  const [language, setLanguage] = useState<Language>("am");
  const [view, setView] = useState<View>("feed");
  const [tab, setTab] = useState<ListingType>("item");
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<PaymentRequest[]>([]);

  const configured = assertPublicConfig();
  const labels = copyFor(language);
  const canAccessAdmin = Boolean(session?.profile.is_admin);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (!configured) {
          setSession(demoSession);
          setLanguage("am");
          return;
        }

        const initData = initTelegram();
        if (!hasTelegramHash(initData)) {
          throw new Error(
            "Missing Telegram login data. Open this page from the bot's Mini App button after redeploying.",
          );
        }

        const fallbackUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const fallbackAdminId = fallbackUser?.id?.toString();
        const isPublicAdmin = appConfig.adminTelegramIds.includes(
          fallbackAdminId ?? "",
        );

        try {
          const verified = await verifyTelegram(initData);
          const isAdmin = Boolean(
            verified.profile.is_admin ||
            appConfig.adminTelegramIds.includes(verified.profile.telegram_id),
          );
          setSession({
            ...verified,
            initData,
            profile: { ...verified.profile, is_admin: isAdmin },
          });
          setLanguage(verified.profile.language ?? "am");
          return;
        } catch (error) {
          if (fallbackUser && isPublicAdmin) {
            setSession({
              initData,
              profile: {
                id: fallbackAdminId ?? fallbackUser.id.toString(),
                telegram_id: fallbackAdminId ?? fallbackUser.id.toString(),
                username: fallbackUser.username ?? null,
                first_name: fallbackUser.first_name ?? null,
                last_name: fallbackUser.last_name ?? null,
                language: "am",
                is_admin: true,
              },
            });
            setLanguage("am");
            return;
          }

          const message =
            error instanceof Error ? error.message : "Telegram login failed";
          throw new Error(message);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Telegram login failed";
        setToast({ type: "error", title: "Login failed", message });
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [configured]);

  useEffect(() => {
    loadFeed();
    if (session) void loadMine();
    if (session?.profile.is_admin) void loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, tab]);

  useEffect(() => {
    if (view === "admin" && !canAccessAdmin) {
      setView("feed");
    }
  }, [canAccessAdmin, view]);

  useEffect(() => {
    setCategory("all");
  }, [tab]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredListings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return listings
      .filter((listing) => listing.type === tab)
      .filter((listing) => category === "all" || listing.category === category)
      .filter((listing) => {
        if (!needle) return true;
        return [
          listing.title,
          listing.location,
          listing.category,
          listing.description,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const boosted =
          Number(isCurrentlyBoosted(b)) - Number(isCurrentlyBoosted(a));
        if (boosted !== 0) return boosted;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [category, listings, query, tab]);

  async function loadFeed() {
    if (!configured) {
      setListings(sampleListings);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("listings")
      .select("*, listing_images(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      setToast({ type: "error", title: "Could not load listings", message: error.message });
      return;
    }

    setListings(withImageUrls(data ?? []));
  }

  async function loadMine() {
    if (!session || !configured) {
      setMyListings(sampleListings);
      return;
    }

    try {
      const data = await callFunction("list-my-listings", {});
      setMyListings(withImageUrls(data.listings ?? []));
    } catch (error) {
      setToast({
        type: "error",
        title: "Could not load your ads",
        message: error instanceof Error ? error.message : labels.error,
      });
    }
  }

  async function loadPayments() {
    if (!configured) return;
    try {
      const data = await callFunction("list-admin-payments", {});
      setPayments(data.payments ?? []);
    } catch {
      setPayments([]);
    }
  }

  async function createListing(formData: FormData) {
    if (!session) return;
    setBusy(true);
    setBusyMessage("Preparing your post...");
    setFieldErrors({});
    try {
      const type = formData.get("type") as ListingType;
      const files = Array.from(formData.getAll("images")).filter(
        (file): file is File => file instanceof File && file.size > 0,
      );
      const imagePaths: string[] = [];

      if (files.length > 4) throw new Error("Maximum 4 images");

      if (configured && type === "item") {
        for (const file of files) {
          const compressed = await compressListingImage(file);
          const path = `${session.profile.id}/${crypto.randomUUID()}.jpg`;
          const { error } = await supabase.storage
            .from("listing-images")
            .upload(path, compressed, {
              contentType: "image/jpeg",
              upsert: false,
            });
          if (error) throw error;
          imagePaths.push(path);
        }
      }

      const payload = listingInputSchema.parse({
        type,
        title: formData.get("title"),
        description: formData.get("description") || undefined,
        price: formData.get("price") || undefined,
        salary: formData.get("salary") || undefined,
        category: formData.get("category") || undefined,
        location: formData.get("location"),
        condition: formData.get("condition") || undefined,
        phone: formData.get("phone"),
        imagePaths,
      });

      if (configured) {
        await callFunction("create-listing", payload);
        await loadFeed();
        await loadMine();
      } else {
        setMyListings((current) => [
          demoListing(payload, session.profile.id),
          ...current,
        ]);
      }

      setToast({
        type: "success",
        title: "Post published",
        message: type === "item" ? "Your item is now visible in the feed." : "Your job opening is now visible in the feed.",
      });
      setView("my-ads");
    } catch (error) {
      if (error instanceof ZodError) {
        const nextErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const key = issue.path[0]?.toString();
          if (key) nextErrors[key] = issue.message;
        }
        setFieldErrors(nextErrors);
      }
      setToast({
        type: "error",
        title: "Please check the form",
        message: formatError(error, labels.error),
      });
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function deleteListing(listing: Listing) {
    if (!window.confirm("Are you sure?")) return;
    setBusy(true);
    setBusyMessage("Deleting your ad...");
    try {
      if (configured) {
        await callFunction("delete-listing", { listingId: listing.id });
        await loadFeed();
        await loadMine();
      } else {
        setMyListings((current) =>
          current.map((item) =>
            item.id === listing.id ? { ...item, status: "deleted" } : item,
          ),
        );
      }
      setToast({ type: "success", title: "Ad deleted", message: "Your ad has been removed from the public feed." });
    } catch (error) {
      setToast({
        type: "error",
        title: "Delete failed",
        message: formatError(error, labels.error),
      });
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function requestUpgrade(formData: FormData) {
    if (!session) return;
    setBusy(true);
    setBusyMessage("Submitting your payment request...");
    try {
      const upgradeType = formData.get("upgradeType") as UpgradeType;
      const listingId = formData.get("listingId")?.toString() || null;
      const receipt = formData.get("receipt");
      if (!(receipt instanceof File) || receipt.size === 0)
        throw new Error("Receipt is required");

      let screenshotPath = "demo/receipt.jpg";
      if (configured) {
        const path = `${session.profile.id}/receipts/${crypto.randomUUID()}-${receipt.name}`;
        const { error } = await supabase.storage
          .from("payment-screenshots")
          .upload(path, receipt, { upsert: false });
        if (error) throw error;
        screenshotPath = path;
        await callFunction("request-upgrade", {
          upgradeType,
          listingId,
          screenshotPath,
        });
      }

      setToast({
        type: "success",
        title: "Payment request submitted",
        message: `Admin will review your ${upgradeAmounts[upgradeType]} ETB upgrade request.`,
      });
    } catch (error) {
      setToast({
        type: "error",
        title: "Payment request failed",
        message: formatError(error, labels.error),
      });
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function reviewPayment(id: string, action: "approve" | "reject") {
    setBusy(true);
    setBusyMessage(action === "approve" ? "Approving request..." : "Rejecting request...");
    try {
      await callFunction("admin-review-payment", {
        paymentRequestId: id,
        action,
      });
      await loadPayments();
      await loadFeed();
      setToast({ type: "success", title: action === "approve" ? "Request approved" : "Request rejected", message: "The payment queue has been updated." });
    } catch (error) {
      setToast({
        type: "error",
        title: "Review failed",
        message: formatError(error, labels.error),
      });
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function callFunction(name: string, body: unknown) {
    const endpoint = functionUrl(name);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: appConfig.supabaseAnonKey,
        Authorization: `Bearer ${appConfig.supabaseAnonKey}`,
        "x-telegram-id": session?.profile.telegram_id ?? "",
        "x-telegram-init-data": session?.initData ?? "",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json().catch(() => ({}));
  }

  if (loading) {
    return (
      <main className="mobile-shell grid place-items-center bg-[radial-gradient(circle_at_top,#fff7df,transparent_34%),linear-gradient(180deg,#f4f6f3,#e8efe9)] p-6 text-sm text-ink">
        <LoadingState label={labels.loading} />
      </main>
    );
  }

  return (
    <main className="mobile-shell min-h-dvh bg-[radial-gradient(circle_at_16%_0%,#ffe6a9,transparent_28%),radial-gradient(circle_at_100%_20%,#d7efe8,transparent_30%),linear-gradient(180deg,#f8faf5,#eef3ef)] pb-24">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-mist/90 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink/60">Dessie</p>
            <h1 className="text-2xl font-black tracking-normal">
              {labels.appName}
            </h1>
          </div>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white"
            onClick={() =>
              setLanguage((value) => (value === "am" ? "en" : "am"))
            }
            aria-label="Change language"
          >
            <Languages size={20} />
          </button>
        </div>
      </header>

      {view === "feed" && (
        <section className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1">
            <TabButton
              active={tab === "item"}
              onClick={() => setTab("item")}
              label={labels.items}
            />
            <TabButton
              active={tab === "job"}
              onClick={() => setTab("job")}
              label={labels.jobs}
            />
          </div>
          <div className="flex h-12 items-center gap-2 rounded-lg border border-black/10 bg-white px-3">
            <Search size={18} />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              placeholder={labels.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Filter size={18} />
          </div>
          <select
            className="h-12 w-full rounded-lg border border-black/10 bg-white px-3 outline-none"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">
              {language === "am" ? "ሁሉም ምድቦች" : "All categories"}
            </option>
            {categoriesFor(tab).map((option) => (
              <option key={option.value} value={option.value}>
                {option.labels[language]}
              </option>
            ))}
          </select>
          <ListingGrid
            listings={filteredListings}
            language={language}
            onSelect={setSelected}
          />
        </section>
      )}

      {view === "post" && (
        <PostForm busy={busy} fieldErrors={fieldErrors} language={language} onSubmit={createListing} />
      )}
      {view === "my-ads" && (
        <MyAds
          busy={busy}
          listings={myListings}
          language={language}
          onDelete={deleteListing}
          onRequestUpgrade={requestUpgrade}
        />
      )}
      {view === "admin" && canAccessAdmin && (
        <AdminQueue busy={busy} payments={payments} onReview={reviewPayment} />
      )}

      <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-4 border-t border-black/10 bg-white p-2">
        <NavButton
          active={view === "feed"}
          icon={<Megaphone size={19} />}
          label="Feed"
          onClick={() => setView("feed")}
        />
        <NavButton
          active={view === "post"}
          icon={<Plus size={19} />}
          label={labels.post}
          onClick={() => setView("post")}
        />
        <NavButton
          active={view === "my-ads"}
          icon={<ReceiptText size={19} />}
          label={labels.myAds}
          onClick={() => setView("my-ads")}
        />
        {canAccessAdmin && (
          <NavButton
            active={view === "admin"}
            icon={<Briefcase size={19} />}
            label={labels.admin}
            onClick={() => setView("admin")}
          />
        )}
      </nav>

      {selected && (
        <ListingSheet
          listing={selected}
          language={language}
          onImagePreview={setImagePreview}
          onClose={() => setSelected(null)}
        />
      )}
      {imagePreview && (
        <ImagePreview src={imagePreview} onClose={() => setImagePreview(null)} />
      )}
      {toast && <ToastView toast={toast} onClose={() => setToast(null)} />}
      {busy && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-white/70 text-sm font-bold backdrop-blur-sm">
          <LoadingState label={busyMessage || labels.loading} />
        </div>
      )}
    </main>
  );
}

function copyFor(language: Language) {
  return {
    appName: t(language, "appName"),
    items: t(language, "items"),
    jobs: t(language, "jobs"),
    post: t(language, "post"),
    myAds: t(language, "myAds"),
    admin: t(language, "admin"),
    search: t(language, "search"),
    loading: t(language, "loading"),
    success: t(language, "success"),
    error: t(language, "error"),
  };
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-11 rounded-md text-sm font-bold ${active ? "bg-leaf text-white" : "text-ink/70"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function NavButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex flex-col items-center gap-1 rounded-md py-2 text-[11px] font-bold ${active ? "text-leaf" : "text-ink/55"} disabled:opacity-30`}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ListingGrid({
  listings,
  language,
  onSelect,
}: {
  listings: Listing[];
  language: Language;
  onSelect: (listing: Listing) => void;
}) {
  if (listings.length === 0)
    return (
      <p className="py-12 text-center text-sm text-ink/60">
        {t(language, "empty")}
      </p>
    );
  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <button
          key={listing.id}
          className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm ${isCurrentlyBoosted(listing) ? "border-gold ring-2 ring-gold/30" : "border-black/10"}`}
          onClick={() => onSelect(listing)}
        >
          <div className="flex gap-3">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-mist">
              {listing.listing_images?.[0]?.public_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="h-full w-full object-cover"
                  src={listing.listing_images[0].public_url}
                  alt=""
                />
              ) : (
                <Megaphone className="text-ink/35" />
              )}
            </div>
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
                  ? `${listing.price ?? "-"} ETB`
                  : listing.salary
                    ? `${listing.salary} ETB`
                    : "Open"}
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

function ListingSheet({
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
  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/35"
      onClick={onClose}
    >
      <section
        className="max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-black/20" />
        <div className="flex gap-2 overflow-x-auto">
          {(listing.listing_images?.length
            ? listing.listing_images
            : [{ id: "blank", public_url: "" } as any]
          ).map((image) => (
            <button
              key={image.id}
              className="relative grid h-52 min-w-full place-items-center overflow-hidden rounded-lg bg-mist"
              type="button"
              onClick={() => image.public_url && onImagePreview(image.public_url)}
            >
              {image.public_url ? (
                <>
                <img
                  className="h-full w-full object-cover"
                  src={image.public_url}
                  alt=""
                />
                <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow">
                  <Eye size={18} />
                </span>
                </>
              ) : (
                <ImageIcon className="text-ink/35" />
              )}
            </button>
          ))}
        </div>
        <h2 className="mt-4 text-2xl font-black">{listing.title}</h2>
        <p className="mt-1 text-sm text-ink/60">{listing.location}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
          {listing.description}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <a
            className="grid h-12 place-items-center rounded-lg bg-leaf font-black text-white"
            href={`tel:${listing.phone}`}
          >
            {t(language, "call")}
          </a>
          <a
            className="grid h-12 place-items-center rounded-lg bg-ember font-black text-white"
            href={username ? `https://t.me/${username}` : "#"}
          >
            {t(language, "telegram")}
          </a>
        </div>
      </section>
    </div>
  );
}

function PostForm({
  busy,
  fieldErrors,
  language,
  onSubmit,
}: {
  busy: boolean;
  fieldErrors: Record<string, string>;
  language: Language;
  onSubmit: (formData: FormData) => void;
}) {
  const [type, setType] = useState<ListingType>("item");
  const formCopy = cleanPostCopy[language];
  return (
    <form
      className="space-y-3 p-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1">
        <TabButton
          active={type === "item"}
          onClick={() => setType("item")}
          label={formCopy.sellItem}
        />
        <TabButton
          active={type === "job"}
          onClick={() => setType("job")}
          label={formCopy.hireWorker}
        />
      </div>
      <input type="hidden" name="type" value={type} />
      <Field
        name="title"
        placeholder={type === "item" ? formCopy.itemTitle : formCopy.jobTitle}
        error={fieldErrors.title}
        required
      />
      <SelectField name="category" label={formCopy.category} required>
        <option value="">{formCopy.category}</option>
        {categoriesFor(type).map((option) => (
          <option key={option.value} value={option.value}>
            {option.labels[language]}
          </option>
        ))}
      </SelectField>
      <FieldError message={fieldErrors.category} />
      {type === "item" ? (
        <>
          <Field
            name="price"
            placeholder={formCopy.price}
            type="number"
            error={fieldErrors.price}
            required
          />
          <SelectField name="condition" label={formCopy.condition}>
            <option value="used">{formCopy.used}</option>
            <option value="new">{formCopy.new}</option>
          </SelectField>
          <label className="block rounded-lg border border-dashed border-black/20 bg-white p-4 text-sm">
            {formCopy.images}
            <input
              className="mt-2 w-full text-sm"
              name="images"
              type="file"
              accept="image/*"
              multiple
            />
          </label>
        </>
      ) : (
        <>
          <Field name="salary" placeholder={formCopy.salary} type="number" error={fieldErrors.salary} />
        </>
      )}
      <Field name="location" placeholder={formCopy.location} error={fieldErrors.location} required />
      <Field name="phone" placeholder={formCopy.phone} error={fieldErrors.phone} required />
      <textarea
        className={`min-h-28 w-full rounded-lg border bg-white p-3 outline-none ${fieldErrors.description ? "border-red-300 ring-2 ring-red-100" : "border-black/10"}`}
        name="description"
        placeholder={type === "job" ? formCopy.requirements : formCopy.details}
      />
      <FieldError message={fieldErrors.description} />
      <button
        className="h-12 w-full rounded-lg bg-leaf font-black text-white disabled:opacity-60"
        disabled={busy}
      >
        {t(language, "submit")}
      </button>
    </form>
  );
}

const cleanPostCopy = {
  am: {
    sellItem: "እቃ ለመሸጥ",
    hireWorker: "ስራ ለመለጠፍ",
    itemTitle: "የእቃው ርዕስ",
    jobTitle: "የስራው ርዕስ",
    category: "ምድብ",
    price: "ዋጋ ETB",
    salary: "ደመወዝ ETB (አማራጭ)",
    condition: "ሁኔታ",
    new: "አዲስ",
    used: "ያገለገለ",
    images: "ፎቶዎች፣ ከፍተኛ 4",
    location: "አካባቢ",
    phone: "ስልክ ለምሳሌ 0912345678",
    requirements: "መስፈርቶች",
    details: "ዝርዝር",
  },
  en: {
    sellItem: "Sell an item",
    hireWorker: "Post a job",
    itemTitle: "Item title",
    jobTitle: "Job title",
    category: "Category",
    price: "Price ETB",
    salary: "Salary ETB (optional)",
    condition: "Condition",
    new: "New",
    used: "Used",
    images: "Images, max 4",
    location: "Location",
    phone: "Phone e.g. 0912345678",
    requirements: "Requirements",
    details: "Details",
  },
};

function Field({
  error,
  name,
  placeholder,
  type = "text",
  required,
}: {
  error?: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <input
        className={`h-12 w-full rounded-lg border bg-white px-3 outline-none ${error ? "border-red-300 ring-2 ring-red-100" : "border-black/10"}`}
        name={name}
        placeholder={placeholder}
        type={type}
        required={required}
      />
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-bold text-red-600">{message}</p>;
}

function SelectField({
  children,
  label,
  name,
  required,
}: {
  children: ReactNode;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <select
      className="h-12 w-full rounded-lg border border-black/10 bg-white px-3 outline-none"
      name={name}
      aria-label={label}
      required={required}
    >
      {children}
    </select>
  );
}

const postCopy = {
  am: {
    sellItem: "እቃ ለመሸጥ",
    hireWorker: "ስራ ለመለጠፍ",
    itemTitle: "የእቃው ርዕስ",
    jobTitle: "የስራው ርዕስ",
    category: "ምድብ",
    price: "ዋጋ ETB",
    salary: "ደመወዝ ETB (አማራጭ)",
    jobType: "የስራ አይነት",
    condition: "ሁኔታ",
    new: "አዲስ",
    used: "ያገለገለ",
    images: "ፎቶዎች፣ ከፍተኛ 4",
    location: "አካባቢ",
    phone: "ስልክ ለምሳሌ 0912345678",
    requirements: "መስፈርቶች",
    details: "ዝርዝር",
  },
  en: {
    sellItem: "Sell an item",
    hireWorker: "Post a job",
    itemTitle: "Item title",
    jobTitle: "Job title",
    category: "Category",
    price: "Price ETB",
    salary: "Salary ETB (optional)",
    jobType: "Job type",
    condition: "Condition",
    new: "New",
    used: "Used",
    images: "Images, max 4",
    location: "Location",
    phone: "Phone e.g. 0912345678",
    requirements: "Requirements",
    details: "Details",
  },
};

function MyAds({
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
            ? "ማስታወቂያዎን 7 ቀን ማራዘም፣ 3 ቀን ከላይ ማሳየት፣ ወይም ከሳምንታዊ ገደቡ በላይ አንድ ተጨማሪ ፖስት መግዛት ይችላሉ።"
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
          <select
            className="h-12 w-full rounded-md border border-black/10 px-3"
            name="listingId"
            required
          >
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
          Telebirr: {appConfig.payment.telebirrName} /{" "}
          {appConfig.payment.telebirrNumber}
          <br />
          CBE: {appConfig.payment.cbeName} / {appConfig.payment.cbeNumber}
        </div>
        <input
          className="w-full text-sm"
          name="receipt"
          type="file"
          accept="image/*"
          required
        />
        <button
          className="h-11 w-full rounded-lg bg-ember font-black text-white disabled:opacity-60"
          disabled={busy}
        >
          {t(language, "submit")}
        </button>
      </form>

      {listings.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink/60">
          {t(language, "empty")}
        </p>
      ) : (
        listings.map((listing) => (
          <article
            key={listing.id}
            className="rounded-lg border border-black/10 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{listing.title}</h3>
                <p className="mt-2 text-xs font-bold text-leaf">
                  {categoryLabel(listing.type, listing.category, language)}
                  {listing.type === "item" && listing.price ? ` - ${listing.price} ETB` : ""}
                  {listing.type === "job" && listing.salary ? ` - ${listing.salary} ETB` : ""}
                </p>
                <p className="text-sm text-ink/60">
                  {listing.status} · expires{" "}
                  {new Date(listing.expires_at).toLocaleDateString()}
                </p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600"
                onClick={() => onDelete(listing)}
                aria-label="Delete"
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

function AdminQueue({
  busy,
  payments,
  onReview,
}: {
  busy: boolean;
  payments: PaymentRequest[];
  onReview: (id: string, action: "approve" | "reject") => void;
}) {
  return (
    <section className="space-y-3 p-4">
      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black">Payment verification</h2>
        <p className="mt-1 text-sm text-ink/60">
          Review the ad, requester, amount, and receipt before approving an upgrade.
        </p>
      </div>
      {payments.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink/60">
          No pending payments
        </p>
      ) : (
        payments.map((payment) => (
          <article
            key={payment.id}
            className="space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm"
          >
            <div>
              <h2 className="font-black">
                {payment.upgrade_type} · {payment.amount_etb} ETB
              </h2>
              <p className="text-sm text-ink/60">
                {payment.listings?.title ?? "Extra post slot"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <InfoPill label="Upgrade" value={upgradeLabel(payment.upgrade_type)} />
              <InfoPill label="Amount" value={`${payment.amount_etb} ETB`} />
              <InfoPill label="Requester" value={payment.profiles?.username ? `@${payment.profiles.username}` : payment.profiles?.telegram_id ?? "Unknown"} />
              <InfoPill label="Submitted" value={new Date(payment.created_at).toLocaleString()} />
              <InfoPill label="Ad type" value={payment.listings?.type ?? "Overflow"} />
              <InfoPill label="Location" value={payment.listings?.location ?? "-"} />
              <InfoPill label="Phone" value={payment.listings?.phone ?? "-"} />
              <InfoPill label="Status" value={payment.status} />
            </div>
            <a
              className="block rounded-md bg-mist p-3 text-sm underline"
              href={
                payment.screenshot_url ??
                getStoragePublicUrl(
                  "payment-screenshots",
                  payment.screenshot_path,
                )
              }
              target="_blank"
            >
              Open receipt screenshot
            </a>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-lg bg-leaf font-black text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => onReview(payment.id, "approve")}
              >
                Approve
              </button>
              <button
                className="h-11 rounded-lg bg-red-600 font-black text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => onReview(payment.id, "reject")}
              >
                Reject
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  if (!toast) return null;
  return (
    <button
      className={`fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-[448px] items-start gap-3 rounded-lg p-3 text-left text-sm text-white shadow-lg ${toast.type === "success" ? "bg-leaf" : "bg-red-600"}`}
      onClick={onClose}
    >
      {toast.type === "success" ? <CheckCircle2 className="mt-0.5 shrink-0" size={20} /> : <AlertCircle className="mt-0.5 shrink-0" size={20} />}
      <span>
        <span className="block font-black">{toast.title}</span>
        <span className="mt-0.5 block text-white/90">{toast.message}</span>
      </span>
    </button>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-black/10 bg-white/90 px-6 py-5 text-center shadow-sm">
      <LoaderCircle className="animate-spin text-leaf" size={32} />
      <p className="text-sm font-black text-ink">{label}</p>
    </div>
  );
}

function ImagePreview({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={onClose}>
      <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-ink" aria-label="Close image" onClick={onClose}>
        <X size={22} />
      </button>
      <img className="max-h-[88dvh] max-w-full rounded-lg object-contain" src={src} alt="" onClick={(event) => event.stopPropagation()} />
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-mist p-2">
      <p className="font-bold text-ink/45">{label}</p>
      <p className="mt-0.5 break-words font-black text-ink">{value}</p>
    </div>
  );
}

function upgradeLabel(type: UpgradeType) {
  if (type === "extend") return "Extend ad";
  if (type === "boost") return "Boost ad";
  return "Extra post";
}

function formatError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(". ");
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function withImageUrls(rows: Listing[]): Listing[] {
  return rows.map((listing) => ({
    ...listing,
    listing_images: listing.listing_images?.map((image) => ({
      ...image,
      public_url: getStoragePublicUrl("listing-images", image.storage_path),
    })),
  }));
}

function demoListing(payload: any, ownerId: string): Listing {
  return {
    id: crypto.randomUUID(),
    owner_id: ownerId,
    type: payload.type,
    title: payload.title,
    description: payload.description ?? null,
    price: payload.price ?? null,
    salary: payload.salary ?? null,
    category: payload.category ?? null,
    location: payload.location,
    condition: payload.condition ?? null,
    job_type: null,
    phone: payload.phone,
    telegram_username: "demo_user",
    status: "active",
    is_boosted: false,
    boosted_until: null,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  };
}

const sampleListings: Listing[] = [
  {
    id: "sample-1",
    owner_id: demoSession.profile.id,
    type: "item",
    title: "Samsung phone, clean condition",
    description: "Lightly used phone around Piassa. Call to inspect.",
    price: 8500,
    salary: null,
    category: "phones",
    location: "Dessie Piassa",
    condition: "Used",
    job_type: null,
    phone: "0912345678",
    telegram_username: "demo_user",
    status: "active",
    is_boosted: true,
    boosted_until: new Date(Date.now() + 2 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    owner_id: demoSession.profile.id,
    type: "job",
    title: "Cafe cashier",
    description:
      "Full time cashier needed. Basic Amharic reading and friendly service required.",
    price: null,
    salary: 6000,
    category: "hospitality",
    location: "Dessie Buanbu Wuha",
    condition: null,
    job_type: "Full time",
    phone: "0912345678",
    telegram_username: "demo_user",
    status: "active",
    is_boosted: false,
    boosted_until: null,
    expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];
