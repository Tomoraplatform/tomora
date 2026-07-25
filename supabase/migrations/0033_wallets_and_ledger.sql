-- =============================================================
-- Creator wallet, Tomora platform (admin) wallet, and the unified
-- transactions ledger that every Tomora-bound payment writes into.
-- =============================================================

create extension if not exists "pgcrypto";

-- Creator earnings wallet (academy_creators, not auth.users) ----
create table if not exists public.creator_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.academy_creators(id) on delete cascade,
  course_id uuid references public.creator_courses(id) on delete set null,
  type text not null,                       -- income | withdrawal
  source text,                              -- course_sale | payout
  amount integer not null,                  -- naira, always positive
  status text not null default 'completed', -- completed | pending | failed
  reference text,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists creator_wallet_creator_idx on public.creator_wallet_transactions(creator_id);
-- Never credit the same payment twice.
create unique index if not exists creator_wallet_type_ref_uidx
  on public.creator_wallet_transactions(type, reference) where reference is not null;

-- Tomora's own wallet: platform fees, subscriptions, domains, etc.
create table if not exists public.platform_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null,                       -- income | withdrawal
  -- subscription | domain | course_fee | academy_course | designs | vat | payout
  source text not null,
  amount integer not null,                  -- naira, always positive
  status text not null default 'completed',
  reference text,
  description text,
  /** VAT collected on behalf of the tax authority, excluded from withdrawable balance. */
  is_vat boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists platform_wallet_source_idx on public.platform_wallet_transactions(source);
create unique index if not exists platform_wallet_type_ref_source_uidx
  on public.platform_wallet_transactions(type, reference, source) where reference is not null;

-- Unified ledger: one row per payment across every Tomora product, so
-- admin stats (overall / yearly / monthly / weekly) come from one place.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  -- subscription | domain | creator_course | academy_course | designs | store_order | donation
  kind text not null,
  reference text,
  -- Gross amount the payer was charged (includes VAT where applicable).
  gross_amount integer not null default 0,
  -- The part that is Tomora revenue (platform fee / full price for own products).
  platform_amount integer not null default 0,
  -- The part paid out to a user (creator share, store owner, donee).
  payee_amount integer not null default 0,
  vat_amount integer not null default 0,
  currency text not null default 'NGN',
  -- Loose references, kept nullable since payers differ per product.
  user_id uuid,
  student_id uuid,
  creator_id uuid,
  site_id uuid,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_kind_idx on public.transactions(kind);
create index if not exists transactions_created_idx on public.transactions(created_at);
create unique index if not exists transactions_kind_ref_uidx
  on public.transactions(kind, reference) where reference is not null;

-- Withdrawal requests from the creator wallet.
create table if not exists public.creator_payouts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.academy_creators(id) on delete cascade,
  amount integer not null,
  status text not null default 'pending',   -- pending | paid | rejected
  note text,
  created_at timestamptz not null default now()
);
create index if not exists creator_payouts_creator_idx on public.creator_payouts(creator_id);

alter table public.creator_wallet_transactions enable row level security;
alter table public.platform_wallet_transactions enable row level security;
alter table public.transactions enable row level security;
alter table public.creator_payouts enable row level security;
-- No policies: deny-all (service-role only).

-- Master switch for Tomora Academy (creator pages included).
alter table public.app_settings add column if not exists academy_open boolean not null default true;
