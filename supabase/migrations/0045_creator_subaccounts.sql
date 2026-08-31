-- =============================================================
-- Creators are paid directly, like every other seller on Tomora.
--
-- A course sale used to land whole in Tomora's Paystack balance and then be
-- divided in the wallet ledger, so a creator's money sat with Tomora until
-- they asked for it. It now splits at Paystack to their own account, with
-- Tomora's 3% taken as a per-transaction charge.
--
-- Existing wallet balances stay exactly as they are and remain withdrawable:
-- that money really is in Tomora's balance and still owed.
-- =============================================================

alter table public.academy_creators
  add column if not exists paystack_subaccount text;
