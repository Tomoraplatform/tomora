-- Highlight products as new arrivals for the storefront.
alter table public.products
  add column if not exists is_new_arrival boolean not null default false;
