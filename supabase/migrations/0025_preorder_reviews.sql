-- =============================================================
-- Pre-order products + verified-purchase reviews (Bakehouse template
-- and any store using per-product review/pre-order features).
-- =============================================================

alter table public.products add column if not exists is_pre_order boolean not null default false;
alter table public.products add column if not exists preorder_note text;

alter table public.reviews add column if not exists verified_purchase boolean not null default false;
