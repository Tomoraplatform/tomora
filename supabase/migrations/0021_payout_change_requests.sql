-- =============================================================
-- Payout bank change requests. A user with an already-connected payout bank
-- must request approval (with proof of ownership) before editing it. Admins
-- approve/decline from the admin dashboard; an approved request unlocks one
-- edit, then is marked "used".
-- =============================================================

create table if not exists public.payout_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  proof_url text,
  note text,
  status text not null default 'pending', -- pending | approved | declined | used
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create index if not exists payout_change_requests_status_idx on public.payout_change_requests(status);
create index if not exists payout_change_requests_user_idx on public.payout_change_requests(user_id);

alter table public.payout_change_requests enable row level security;

-- Users can read and create their own requests; admins manage via the service
-- role (server actions), which bypasses RLS.
drop policy if exists "payout req own read" on public.payout_change_requests;
create policy "payout req own read" on public.payout_change_requests for select using (auth.uid() = user_id);
drop policy if exists "payout req own insert" on public.payout_change_requests;
create policy "payout req own insert" on public.payout_change_requests for insert with check (auth.uid() = user_id);
