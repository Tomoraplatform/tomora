-- Percentage discount applied when a product is on offer.
alter table public.products
  add column if not exists offer_percent integer not null default 0;
