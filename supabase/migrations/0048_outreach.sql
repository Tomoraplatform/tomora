-- =============================================================
-- Admin outreach: emailing users who signed up but never got going.
--
-- Every send is recorded, so an admin can see who was contacted and when
-- rather than mailing the same person twice. Anyone can opt out of these
-- messages; account email (orders, donations, receipts) is unaffected.
-- =============================================================

-- Who does not want to hear from us, and the link that sets it.
alter table public.profiles
  add column if not exists marketing_opt_out boolean not null default false,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists profiles_unsubscribe_token_uidx
  on public.profiles(unsubscribe_token);

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  -- Kept as written, so history survives a profile email change.
  email text not null,
  subject text not null,
  body text not null,
  -- sent | failed | skipped
  status text not null default 'sent',
  error text,
  -- Which admin pressed send.
  sent_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists outreach_messages_user_idx on public.outreach_messages(user_id);
create index if not exists outreach_messages_created_idx on public.outreach_messages(created_at);

alter table public.outreach_messages enable row level security;
-- No policies: service role only (admin server actions).
