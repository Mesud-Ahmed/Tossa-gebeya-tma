# Tossa Gebaya

Mobile-only Telegram Mini App for simple Dessie-area item and job listings.

## Stack

- Next.js App Router, React, Tailwind CSS
- Supabase PostgreSQL, Storage, and Edge Functions
- Telegram WebApp `initData` authentication

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill Supabase, Telegram, admin ID, and payment account values.
3. Apply `supabase/migrations/202607070001_initial_schema.sql` to your Supabase project.
4. Deploy all functions in `supabase/functions`.
5. Run `npm run dev`.

If Supabase public env vars are not configured, the UI opens with demo data so the mobile flow can be inspected locally.

## Supabase Functions

- `verify-telegram-auth`: verifies Telegram initData and upserts profiles.
- `create-listing`: validates posts and enforces weekly limits.
- `list-my-listings`: returns the current Telegram user's listings.
- `delete-listing`: lets owners take down ads.
- `request-upgrade`: creates manual payment requests.
- `list-admin-payments`: returns pending payments with signed receipt URLs.
- `admin-review-payment`: approves/rejects paid upgrades.
- `expire-listings`: expires stale listings.
- `send-expiry-warnings`: sends Telegram day-5 warning messages.

Schedule `expire-listings` and `send-expiry-warnings` daily.
