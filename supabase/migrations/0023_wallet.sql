-- =============================================================
-- Tomora Wallet: ledger of Paystack income (orders + donations) and
-- withdrawals to the owner's connected bank via Paystack Transfers.
-- =============================================================

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  type text not null,                -- 'income' | 'withdrawal'
  source text,                       -- 'order' | 'donation' | 'payout'
  amount integer not null,           -- naira, always positive
  status text not null default 'completed', -- 'completed' | 'pending' | 'failed'
  reference text,                    -- paystack tx / transfer reference
  description text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_tx_user_idx on public.wallet_transactions(user_id);
create index if not exists wallet_tx_site_idx on public.wallet_transactions(site_id);
-- Guard against double-crediting the same payment.
create unique index if not exists wallet_tx_type_ref_uidx
  on public.wallet_transactions(type, reference) where reference is not null;

alter table public.wallet_transactions enable row level security;

-- Owners read their own ledger; all writes happen via the service role.
drop policy if exists "wallet own read" on public.wallet_transactions;
create policy "wallet own read" on public.wallet_transactions
  for select using (auth.uid() = user_id);
