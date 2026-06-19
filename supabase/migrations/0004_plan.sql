-- Track which plan a subscription is on (starter/growth/pro/custom).
alter table public.subscriptions
  add column if not exists plan text;
