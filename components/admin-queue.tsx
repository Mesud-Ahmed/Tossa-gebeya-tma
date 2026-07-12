"use client";

import { Eye } from "lucide-react";
import { getStoragePublicUrl } from "@/lib/supabase";
import type { PaymentRequest } from "@/lib/types";
import { upgradeLabel } from "@/lib/app-utils";
import { InfoPill } from "./ui";

export function AdminQueue({
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
        <p className="py-12 text-center text-sm text-ink/60">No pending payments</p>
      ) : (
        payments.map((payment) => (
          <article key={payment.id} className="space-y-4 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div>
              <h2 className="font-black">
                {upgradeLabel(payment.upgrade_type)} - {payment.amount_etb} ETB
              </h2>
              <p className="text-sm text-ink/60">{payment.listings?.title ?? "Extra post slot"}</p>
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
              className="flex items-center justify-between rounded-md bg-mist p-3 text-sm font-bold underline"
              href={payment.screenshot_url ?? getStoragePublicUrl("payment-screenshots", payment.screenshot_path)}
              target="_blank"
            >
              <span>Open receipt screenshot</span>
              <Eye size={18} />
            </a>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-lg bg-leaf font-black text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => onReview(payment.id, "approve")}
                type="button"
              >
                Approve
              </button>
              <button
                className="h-11 rounded-lg bg-red-600 font-black text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => onReview(payment.id, "reject")}
                type="button"
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
