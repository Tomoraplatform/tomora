-- =============================================================
-- Mark payments that settle straight to the seller's own bank.
--
-- Store sales and donations paid by card now split at Paystack to the payout
-- account the owner connected, so the money never passes through Tomora. The
-- wallet still records the income, because owners read their history there,
-- but it must not be withdrawable: Tomora does not hold it, and paying it out
-- would mean paying it twice.
--
-- Rows written before this keep `false`, which is correct: that money really
-- did land in Tomora's balance and is still theirs to withdraw.
-- =============================================================

alter table public.orders
  add column if not exists settled_direct boolean not null default false;

alter table public.donations
  add column if not exists settled_direct boolean not null default false;
