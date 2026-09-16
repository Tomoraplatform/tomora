-- =============================================================
-- Fixed transaction fee by order size, on the Free plan only (2026-09-16).
--
-- Was: Free 3% + N75, Starter 1.5%.
-- Now: Free pays a fixed fee by the size of the order or donation, and every
-- other plan, Starter included, pays no transaction fee.
--
--   under N5,000         N105
--   under N15,000        N200
--   under N30,000        N250
--   under N50,000        N500
--   N50,000 and above    N750
--
-- The customer still pays it on top of their total.
-- Safe to run more than once.
-- =============================================================

alter table public.plan_fees
  add column if not exists fee_tiers jsonb;

update public.plan_fees
   set fee_percent = 0,
       fee_flat = 0,
       fee_tiers = '[
         {"below": 5000,  "fee": 105},
         {"below": 15000, "fee": 200},
         {"below": 30000, "fee": 250},
         {"below": 50000, "fee": 500},
         {"below": null,  "fee": 750}
       ]'::jsonb,
       updated_at = now()
 where plan_id = 'free';

update public.plan_fees
   set fee_percent = 0,
       fee_flat = 0,
       fee_tiers = null,
       updated_at = now()
 where plan_id <> 'free';
