-- =============================================================
-- Product colour variants + the colour a customer selected on an order
-- =============================================================

alter table public.products
  add column if not exists colors text[] not null default '{}';

alter table public.orders
  add column if not exists color text;
