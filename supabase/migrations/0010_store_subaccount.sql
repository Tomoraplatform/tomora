-- =============================================================
-- Store payouts via Paystack subaccounts (split settlement to the
-- owner's bank automatically on each sale).
-- =============================================================

alter table public.sites
  add column if not exists paystack_subaccount text,
  add column if not exists bank_code text;
