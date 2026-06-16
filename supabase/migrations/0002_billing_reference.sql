-- Track the last processed Paystack reference for idempotent billing updates.
alter table public.subscriptions
  add column if not exists last_reference text;
