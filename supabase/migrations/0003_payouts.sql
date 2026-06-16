-- Payout settings for e-commerce stores.
alter table public.sites
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists account_name text;
