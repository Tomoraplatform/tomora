-- =============================================================
-- Help & Support: messages sent to Tomora from the dashboard
--
-- Distinct from support_messages, which is a visitor talking to a site owner
-- on a published shop. This is a Tomora user talking to Tomora.
--
-- The row is written before the email is attempted, on purpose: sending is
-- best-effort and has failed silently before, and a complaint that exists only
-- as an email is a complaint that can be lost.
-- =============================================================

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,                       -- where the reply should go
  subject text not null,
  message text not null,
  status text not null default 'open',       -- open | answered | closed
  emailed boolean not null default false,    -- did the notification actually send
  created_at timestamptz not null default now()
);

create index if not exists help_requests_created_at_idx on public.help_requests(created_at desc);
create index if not exists help_requests_status_idx on public.help_requests(status);

alter table public.help_requests enable row level security;

-- A signed-in user may lodge a request, and read back their own.
drop policy if exists "help requests insert own" on public.help_requests;
create policy "help requests insert own" on public.help_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "help requests read own" on public.help_requests;
create policy "help requests read own" on public.help_requests
  for select using (public.is_admin() or auth.uid() = user_id);

-- Only admins triage them.
drop policy if exists "help requests admin manage" on public.help_requests;
create policy "help requests admin manage" on public.help_requests
  for all using (public.is_admin());
