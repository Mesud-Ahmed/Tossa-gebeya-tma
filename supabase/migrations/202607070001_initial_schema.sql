create extension if not exists pgcrypto;

create type public.listing_type as enum ('item', 'job');
create type public.listing_status as enum ('active', 'expired', 'deleted');
create type public.upgrade_type as enum ('extend', 'boost', 'overflow');
create type public.payment_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id text not null unique,
  username text,
  first_name text,
  last_name text,
  language text not null default 'am' check (language in ('am', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type public.listing_type not null,
  title text not null check (char_length(title) between 3 and 80),
  description text check (description is null or char_length(description) <= 1200),
  price numeric check (price is null or price > 0),
  salary numeric check (salary is null or salary > 0),
  category text,
  location text not null check (char_length(location) between 2 and 80),
  condition text,
  job_type text,
  phone text not null check (phone ~ '^(\+251|0)?9[0-9]{8}$'),
  telegram_username text,
  status public.listing_status not null default 'active',
  is_boosted boolean not null default false,
  boosted_until timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  warned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'item' and price is not null and category is not null)
    or
    (type = 'job' and description is not null)
  )
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  width int,
  height int,
  size_bytes int,
  created_at timestamptz not null default now(),
  unique (listing_id, sort_order)
);

create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  upgrade_type public.upgrade_type not null,
  amount_etb int not null check (amount_etb in (25, 50)),
  screenshot_path text not null,
  status public.payment_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.extra_post_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_payment_request_id uuid references public.payment_requests(id) on delete set null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index listings_public_feed_idx on public.listings (status, type, is_boosted, boosted_until, created_at desc);
create index listings_owner_idx on public.listings (owner_id, created_at desc);
create index payment_requests_pending_idx on public.payment_requests (status, created_at);
create index extra_slots_available_idx on public.extra_post_slots (user_id, consumed_at);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.payment_requests enable row level security;
alter table public.extra_post_slots enable row level security;

create policy "Public active listings are readable"
  on public.listings for select
  using (status = 'active' and expires_at > now());

create policy "Public listing images are readable"
  on public.listing_images for select
  using (exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id
    and listings.status = 'active'
    and listings.expires_at > now()
  ));

create policy "Profiles are service-managed"
  on public.profiles for select
  using (false);

create policy "Payments are service-managed"
  on public.payment_requests for select
  using (false);

create policy "Slots are service-managed"
  on public.extra_post_slots for select
  using (false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-images', 'listing-images', true, 600000, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-screenshots', 'payment-screenshots', false, 3000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Public can read listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "Client can upload listing images"
  on storage.objects for insert
  with check (bucket_id = 'listing-images');

create policy "Client can upload payment screenshots"
  on storage.objects for insert
  with check (bucket_id = 'payment-screenshots');
