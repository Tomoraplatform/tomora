-- Product highlights for storefront sections: best-seller + on-offer.
alter table public.products
  add column if not exists is_best_seller boolean not null default false,
  add column if not exists is_offer boolean not null default false;
