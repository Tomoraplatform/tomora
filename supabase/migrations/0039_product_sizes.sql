-- =============================================================
-- Product sizes, each with its own size guide image.
--
-- Mirrors the existing colour variants: a list of {name, guide},
-- where `guide` is a public storage URL for the chart that belongs
-- to that size. A shopper picking "M" sees the guide filed under
-- "M", not one chart for the whole product.
--
-- Existing rows default to an empty list, so nothing changes for a
-- product that does not sell by size.
-- =============================================================

alter table public.products
  add column if not exists sizes jsonb not null default '[]'::jsonb;

comment on column public.products.sizes is
  'Size variants: [{ "name": "M", "guide": "https://.../chart.png" }]. Guide is optional per size.';
