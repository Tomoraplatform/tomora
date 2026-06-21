-- =============================================================
-- Admin comps with expiry + admin-controlled plan discounts
-- =============================================================

-- When an admin grants (comps) a plan, it expires at this time.
alter table public.subscriptions
  add column if not exists comp_expires_at timestamptz;

-- Per-plan discount, controlled by admins. Public-readable so pricing pages
-- can show it; only the service role (admin actions) writes.
create table if not exists public.plan_discounts (
  plan_id text primary key,
  percent integer not null default 0 check (percent between 0 and 100),
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.plan_discounts enable row level security;

drop policy if exists "plan_discounts public read" on public.plan_discounts;
create policy "plan_discounts public read" on public.plan_discounts
  for select using (true);
