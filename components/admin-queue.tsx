"use client";

import { Eye } from "lucide-react";
import { getStoragePublicUrl } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import type { Language, PaymentRequest } from "@/lib/types";
import {
  formatEthiopianDate,
  formatCurrency,
  upgradeLabel,
} from "@/lib/app-utils";
import { InfoPill } from "./ui";

export function AdminQueue({
  busy,
  language,
  payments,
  onReview,
}: {
  busy: boolean;
  language: Language;
  payments: PaymentRequest[];
  onReview: (id: string, action: "approve" | "reject") => void;
}) {
  return (
    <section className="space-y-3 p-4">
      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black">
          {t(language, "paymentVerification")}
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          {t(language, "paymentVerificationHelp")}
        </p>
      </div>
      {payments.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink/60">
          {t(language, "noPendingPayments")}
        </p>
      ) : (
        payments.map((payment) => (
          <article
            key={payment.id}
            className="space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm"
          >
            <div>
              <h2 className="font-black">
                {upgradeLabel(payment.upgrade_type, language)} -{" "}
                {payment.amount_etb} ETB
              </h2>
              <p className="text-sm text-ink/60">
                {payment.listings?.title ?? t(language, "extraPostSlot")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <InfoPill
                label={t(language, "paidUpgrades")}
                value={upgradeLabel(payment.upgrade_type, language)}
              />
              <InfoPill
                label={t(language, "amount")}
                value={formatCurrency(payment.amount_etb)}
              />
              <InfoPill
                label={t(language, "requester")}
                value={
                  payment.profiles?.username
                    ? `@${payment.profiles.username}`
                    : (payment.profiles?.telegram_id ?? t(language, "unknown"))
                }
              />
              <InfoPill
                label={t(language, "submitted")}
                value={formatEthiopianDate(payment.created_at)}
              />
              <InfoPill
                label={t(language, "adType")}
                value={payment.listings?.type ?? t(language, "overflow")}
              />
              <InfoPill
                label={t(language, "location")}
                value={payment.listings?.location ?? "-"}
              />
              <InfoPill
                label={t(language, "phone")}
                value={payment.listings?.phone ?? "-"}
              />
              <InfoPill label={t(language, "status")} value={payment.status} />
            </div>
            <a
              className="flex items-center justify-between rounded-md bg-mist p-3 text-sm font-bold underline"
              href={
                payment.screenshot_url ??
                getStoragePublicUrl(
                  "payment-screenshots",
                  payment.screenshot_path,
                )
              }
              target="_blank"
              rel="noreferrer"
            >
              <span>{t(language, "openReceipt")}</span>
              <Eye size={18} />
            </a>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-lg bg-leaf font-black text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => onReview(payment.id, "approve")}
                type="button"
              >
                {t(language, "approve")}
              </button>
              <button
                className="h-11 rounded-lg bg-red-600 font-black text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => onReview(payment.id, "reject")}
                type="button"
              >
                {t(language, "reject")}
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
