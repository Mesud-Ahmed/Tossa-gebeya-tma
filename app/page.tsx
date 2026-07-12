"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Filter, Languages, Megaphone, Plus, ReceiptText, Search } from "lucide-react";
import { ZodError } from "zod";
import { AdminQueue } from "@/components/admin-queue";
import { ListingGrid, ListingSheet } from "@/components/listings";
import { MyAds } from "@/components/my-ads";
import { PostForm } from "@/components/post-form";
import { ImagePreview, LoadingState, NavButton, TabButton, ToastView } from "@/components/ui";
import { formatError, withImageUrls } from "@/lib/app-utils";
import type { Toast, View } from "@/lib/app-ui-types";
import { categoriesFor } from "@/lib/categories";
import { appConfig, assertPublicConfig } from "@/lib/config";
import { demoListing, demoSession, sampleListings } from "@/lib/demo-data";
import { functionUrl } from "@/lib/function-url";
import { t } from "@/lib/i18n";
import { compressListingImage } from "@/lib/images";
import { supabase } from "@/lib/supabase";
import { hasTelegramHash, initTelegram, verifyTelegram } from "@/lib/telegram";
import type { AppSession, Language, Listing, ListingType, PaymentRequest, UpgradeType } from "@/lib/types";
import { isCurrentlyBoosted, listingInputSchema, upgradeAmounts } from "@/lib/validation";

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
          throw new Error("Missing Telegram login data. Open this page from the bot's Mini App button after redeploying.");
        }

        const fallbackUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const fallbackAdminId = fallbackUser?.id?.toString();
        const isPublicAdmin = appConfig.adminTelegramIds.includes(fallbackAdminId ?? "");

        try {
          const verified = await verifyTelegram(initData);
          const isAdmin = Boolean(verified.profile.is_admin || appConfig.adminTelegramIds.includes(verified.profile.telegram_id));
          setSession({ ...verified, initData, profile: { ...verified.profile, is_admin: isAdmin } });
          setLanguage(verified.profile.language ?? "am");
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
          throw error;
        }
      } catch (error) {
        setToast({ type: "error", title: "Login failed", message: formatError(error, "Telegram login failed") });
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [configured]);

  useEffect(() => {
    void loadFeed();
    if (session) void loadMine();
    if (session?.profile.is_admin) void loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, tab]);

  useEffect(() => {
    if (view === "admin" && !canAccessAdmin) setView("feed");
  }, [canAccessAdmin, view]);

  useEffect(() => setCategory("all"), [tab]);

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
        return [listing.title, listing.location, listing.category, listing.description]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const boosted = Number(isCurrentlyBoosted(b)) - Number(isCurrentlyBoosted(a));
        if (boosted !== 0) return boosted;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
      setToast({ type: "error", title: "Could not load your ads", message: formatError(error, labels.error) });
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
      const files = Array.from(formData.getAll("images")).filter((file): file is File => file instanceof File && file.size > 0);
      const imagePaths: string[] = [];

      if (files.length > 4) throw new Error("Maximum 4 images");

      if (configured && type === "item") {
        for (const file of files) {
          const compressed = await compressListingImage(file);
          const path = `${session.profile.id}/${crypto.randomUUID()}.jpg`;
          const { error } = await supabase.storage.from("listing-images").upload(path, compressed, {
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
        setMyListings((current) => [demoListing(payload, session.profile.id), ...current]);
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
      setToast({ type: "error", title: "Please check the form", message: formatError(error, labels.error) });
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
        setMyListings((current) => current.map((item) => (item.id === listing.id ? { ...item, status: "deleted" } : item)));
      }
      setToast({ type: "success", title: "Ad deleted", message: "Your ad has been removed from the public feed." });
    } catch (error) {
      setToast({ type: "error", title: "Delete failed", message: formatError(error, labels.error) });
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
      if (!(receipt instanceof File) || receipt.size === 0) throw new Error("Receipt is required");

      let screenshotPath = "demo/receipt.jpg";
      if (configured) {
        const path = `${session.profile.id}/receipts/${crypto.randomUUID()}-${receipt.name}`;
        const { error } = await supabase.storage.from("payment-screenshots").upload(path, receipt, { upsert: false });
        if (error) throw error;
        screenshotPath = path;
        await callFunction("request-upgrade", { upgradeType, listingId, screenshotPath });
      }

      setToast({
        type: "success",
        title: "Payment request submitted",
        message: `Admin will review your ${upgradeAmounts[upgradeType]} ETB upgrade request.`,
      });
    } catch (error) {
      setToast({ type: "error", title: "Payment request failed", message: formatError(error, labels.error) });
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function reviewPayment(id: string, action: "approve" | "reject") {
    setBusy(true);
    setBusyMessage(action === "approve" ? "Approving request..." : "Rejecting request...");

    try {
      await callFunction("admin-review-payment", { paymentRequestId: id, action });
      await loadPayments();
      await loadFeed();
      setToast({
        type: "success",
        title: action === "approve" ? "Request approved" : "Request rejected",
        message: "The payment queue has been updated.",
      });
    } catch (error) {
      setToast({ type: "error", title: "Review failed", message: formatError(error, labels.error) });
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  }

  async function callFunction(name: string, body: unknown) {
    const response = await fetch(functionUrl(name), {
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
            <h1 className="text-2xl font-black tracking-normal">{labels.appName}</h1>
          </div>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white"
            onClick={() => setLanguage((value) => (value === "am" ? "en" : "am"))}
            aria-label="Change language"
            type="button"
          >
            <Languages size={20} />
          </button>
        </div>
      </header>

      {view === "feed" && (
        <section className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1">
            <TabButton active={tab === "item"} onClick={() => setTab("item")} label={labels.items} />
            <TabButton active={tab === "job"} onClick={() => setTab("job")} label={labels.jobs} />
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
            <option value="all">{language === "am" ? "ሁሉም ምድቦች" : "All categories"}</option>
            {categoriesFor(tab).map((option) => (
              <option key={option.value} value={option.value}>
                {option.labels[language]}
              </option>
            ))}
          </select>
          <ListingGrid listings={filteredListings} language={language} onSelect={setSelected} />
        </section>
      )}

      {view === "post" && <PostForm busy={busy} fieldErrors={fieldErrors} language={language} onSubmit={createListing} />}
      {view === "my-ads" && (
        <MyAds busy={busy} listings={myListings} language={language} onDelete={deleteListing} onRequestUpgrade={requestUpgrade} />
      )}
      {view === "admin" && canAccessAdmin && <AdminQueue busy={busy} payments={payments} onReview={reviewPayment} />}

      <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[480px] -translate-x-1/2 grid-cols-4 border-t border-black/10 bg-white p-2">
        <NavButton active={view === "feed"} icon={<Megaphone size={19} />} label="Feed" onClick={() => setView("feed")} />
        <NavButton active={view === "post"} icon={<Plus size={19} />} label={labels.post} onClick={() => setView("post")} />
        <NavButton active={view === "my-ads"} icon={<ReceiptText size={19} />} label={labels.myAds} onClick={() => setView("my-ads")} />
        {canAccessAdmin && (
          <NavButton active={view === "admin"} icon={<Briefcase size={19} />} label={labels.admin} onClick={() => setView("admin")} />
        )}
      </nav>

      {selected && (
        <ListingSheet listing={selected} language={language} onImagePreview={setImagePreview} onClose={() => setSelected(null)} />
      )}
      {imagePreview && <ImagePreview src={imagePreview} onClose={() => setImagePreview(null)} />}
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
    error: t(language, "error"),
  };
}
