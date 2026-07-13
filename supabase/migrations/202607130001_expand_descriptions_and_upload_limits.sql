alter table public.listings
  drop constraint if exists listings_description_check;

alter table public.listings
  add constraint listings_description_check
  check (description is null or char_length(description) <= 4000);

update storage.buckets
set file_size_limit = 10000000
where id in ('listing-images', 'payment-screenshots');
