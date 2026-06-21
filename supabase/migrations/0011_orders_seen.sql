-- Track which paid orders the owner has seen (for the dashboard "new" badge).
alter table public.orders
  add column if not exists seen boolean not null default false;
