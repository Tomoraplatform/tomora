-- =============================================================
-- Per-transaction platform fee.
--
-- On some plans Tomora takes a fee on each online sale or donation. The
-- customer pays it on top of their total, and it reaches Tomora's main
-- account as Paystack's `transaction_charge` on the split, so the merchant's
-- share is untouched by it.
--
-- Nothing is charged until this migration has run: the app treats a missing
-- `plan_fees` table as "fees off".
-- =============================================================

-- 1. The rate for each plan. Edit a row to change a fee without a redeploy.
--    fee_percent is a percentage (3 = 3%), fee_flat is whole naira.
--    fee = round(subtotal * fee_percent / 100) + fee_flat
create table if not exists public.plan_fees (
  plan_id text primary key,
  fee_percent numeric(5,2) not null default 0 check (fee_percent >= 0 and fee_percent <= 20),
  fee_flat integer not null default 0 check (fee_flat >= 0 and fee_flat <= 5000),
  updated_at timestamptz not null default now()
);

alter table public.plan_fees enable row level security;
drop policy if exists "plan_fees public read" on public.plan_fees;
create policy "plan_fees public read" on public.plan_fees for select using (true);

insert into public.plan_fees (plan_id, fee_percent, fee_flat) values
  ('free',    3.00, 75),
  ('starter', 1.50, 0),
  ('growth',  0,    0),
  ('pro',     0,    0),
  ('onetime', 0,    0),
  ('custom',  0,    0),
  ('basic',   0,    0)
on conflict (plan_id) do nothing;

-- 2. Per-merchant override. Null means "use the plan's rate". It only applies
--    while the subscription is active.
alter table public.subscriptions
  add column if not exists fee_percent_override numeric(5,2)
    check (fee_percent_override is null or (fee_percent_override >= 0 and fee_percent_override <= 20)),
  add column if not exists fee_flat_override integer
    check (fee_flat_override is null or (fee_flat_override >= 0 and fee_flat_override <= 5000));

-- Merchants already on a paid plan when the fee launched keep 0%. Only Starter
-- has a fee among the paid plans today, so in practice this protects existing
-- Starter subscribers; setting it on everyone paying keeps them at 0% if the
-- paid plans' rates are ever raised later. Clear a row's override to move that
-- merchant onto their plan's current rate.
update public.subscriptions
   set fee_percent_override = 0, fee_flat_override = 0
 where status in ('active', 'past_due')
   and fee_percent_override is null
   and fee_flat_override is null;

-- 3. What each online payment was made of. One row per Paystack reference,
--    for store orders (which are stored one row per item) and donations alike.
create table if not exists public.payment_charges (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  kind text not null check (kind in ('order', 'donation')),
  site_id uuid references public.sites(id) on delete set null,
  owner_id uuid,
  plan_id text,
  fee_percent numeric(5,2) not null default 0,
  fee_flat integer not null default 0,
  -- What the merchant is owed: items after discount plus shipping, or the gift.
  subtotal integer not null,
  -- Tomora's cut, sent to Paystack as transaction_charge.
  platform_fee integer not null default 0,
  -- Paystack's fee passed on to the customer, when the merchant chose that.
  passthrough_fee integer not null default 0,
  -- What the customer was charged: subtotal + platform_fee + passthrough_fee.
  total_charged integer not null,
  status text not null default 'pending',
  -- Paystack's own account of the split, read back once the payment is paid,
  -- in naira. Kept so the fee can be checked against what actually arrived.
  split_integration integer,
  split_subaccount integer,
  split_paystack integer,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payment_charges_site_idx on public.payment_charges(site_id);
alter table public.payment_charges enable row level security;
-- No policies: service role only.
