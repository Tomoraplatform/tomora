-- Tracks sites that have paid for an extra custom domain (₦8,000),
-- when the plan does not already include one for that site.
alter table public.sites
  add column if not exists domain_purchased boolean not null default false;
