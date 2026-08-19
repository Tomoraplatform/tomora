-- =============================================================
-- Sandbox (test) mode.
--
-- Test data lives in the same tables as real data, marked by a flag, so the
-- sandbox exercises exactly the code a real sale does. Every column defaults
-- to false, so all existing rows stay real and nothing changes for anyone
-- until an admin turns the mode on.
--
-- Safety rests on two rules enforced in application code:
--   * anything customer-facing, financial, or outbound reads is_test = false
--   * nothing with is_test = true may reach Paystack, Resend, or a wallet
--     balance that a payout is calculated from
-- =============================================================

-- Orders written by the sandbox. Indexed with site_id because every dashboard
-- read is "this site, this mode".
alter table public.orders
  add column if not exists is_test boolean not null default false;
create index if not exists orders_site_test_idx on public.orders(site_id, is_test);

-- Wallet credits from a test sale, kept out of the real balance a withdrawal
-- is paid from.
alter table public.wallet_transactions
  add column if not exists is_test boolean not null default false;
create index if not exists wallet_tx_user_test_idx on public.wallet_transactions(user_id, is_test);

-- Platform ledger rows, so Tomora's own revenue reporting stays clean.
alter table public.transactions
  add column if not exists is_test boolean not null default false;
create index if not exists transactions_test_idx on public.transactions(is_test);

-- Products an admin created only for demos. They never appear on a published
-- storefront, and never in a real checkout.
alter table public.products
  add column if not exists is_test_only boolean not null default false;
create index if not exists products_site_testonly_idx on public.products(site_id, is_test_only);

-- The demo store an admin builds sandbox orders against, so test data never
-- lands in a real seller's shop.
alter table public.sites
  add column if not exists is_demo boolean not null default false;
