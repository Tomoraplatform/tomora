-- =============================================================
-- Per-colour product variants with their own image (name + image)
-- =============================================================

alter table public.products
  add column if not exists color_variants jsonb not null default '[]';
