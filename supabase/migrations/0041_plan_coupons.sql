-- =============================================================
-- Subscription coupon codes.
--
-- `plan_discounts` (0009) is a blanket price cut everyone sees on the pricing
-- page. This is the opposite: a code only the people you give it to can use,
-- redeemed at subscription or renewal checkout.
--
-- RLS deny-all; all access goes through the service-role client in server code.
-- =============================================================

create extension if not exists "pgcrypto";

create table if not exists public.plan_coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                        -- stored uppercase
  percent integer not null default 0,               -- 1..100 off the plan price
  plan_id text,                                     -- null = valid on any plan
  max_uses integer,                                 -- null = unlimited
  used_count integer not null default 0,
  per_user_limit integer default 1,                 -- null = unlimited per user
  active boolean not null default true,
  expires_at timestamptz,                           -- null = never expires
  note text,                                        -- what it is for, admin eyes only
  created_at timestamptz not null default now()
);
create index if not exists plan_coupons_code_idx on public.plan_coupons(code);

-- One row per successful redemption. Doubles as the per-user cap and the
-- audit trail of who used what, keyed by the payment it paid for.
create table if not exists public.plan_coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.plan_coupons(id) on delete cascade,
  user_id uuid not null,
  reference text unique not null,                   -- the Paystack reference
  plan_id text,
  percent integer not null default 0,
  discount_amount integer not null default 0,       -- naira taken off
  created_at timestamptz not null default now()
);
create index if not exists plan_coupon_redemptions_coupon_idx on public.plan_coupon_redemptions(coupon_id);
create index if not exists plan_coupon_redemptions_user_idx on public.plan_coupon_redemptions(user_id);

alter table public.plan_coupons enable row level security;
alter table public.plan_coupon_redemptions enable row level security;
-- No policies: deny-all.

-- Atomic increment. Two people redeeming the last use of a code at the same
-- moment would both pass a read-then-write check; a single UPDATE cannot.
create or replace function public.bump_plan_coupon_use(p_coupon uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.plan_coupons
     set used_count = used_count + 1
   where id = p_coupon
  returning used_count;
$$;
