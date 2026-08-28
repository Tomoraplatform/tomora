-- =============================================================
-- Repair subscriptions broken by a paid renewal leaving a comp date behind.
--
-- A real payment used to set the subscription active without clearing
-- `comp_expires_at` from an earlier admin grant. The next visitor to that
-- seller's site ran expireCompIfDue, which saw an active subscription with a
-- comp date in the past, cancelled it, and took the site offline again. The
-- only way back was an admin flipping the site live by hand, and it would fall
-- over again on the next visit.
--
-- lib/billing.ts now clears the date on payment. This fixes the rows already
-- written that way.
-- =============================================================

-- 1. A paid subscription is not a comp. Clearing the date removes the trigger
--    for everyone who has ever paid, whatever state they are in now.
update public.subscriptions
   set comp_expires_at = null
 where comp_expires_at is not null
   and last_reference like 'tomplat\_%';

-- 2. Bring back the ones this already knocked offline.
--
--    Deliberately narrow. It matches only subscriptions cancelled while a comp
--    date was still attached and while the period they had paid for was still
--    running, which is the exact signature of the bug: revokePlan clears the
--    comp date when an admin cancels someone on purpose, so a deliberate
--    revoke cannot match this.
with restored as (
  update public.subscriptions
     set status = 'active',
         comp_expires_at = null
   where status = 'cancelled'
     and comp_expires_at is not null
     and comp_expires_at < now()
     and last_reference like 'tomplat\_%'
     and next_billing_date > now()
  returning user_id
)
update public.sites s
   set is_live = true
  from restored r
 where s.user_id = r.user_id
   and coalesce(s.is_demo, false) = false;
