-- =============================================================
-- Assisted domain purchase: a visitor pays for a new domain and
-- an admin registers it at the registrar, then it gets connected.
-- =============================================================

create table if not exists public.domain_requests (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null,
  amount integer not null,
  reference text,
  -- paid -> registered (bought at registrar) -> connected (live) | cancelled
  status text not null default 'paid',
  created_at timestamptz not null default now()
);
create index if not exists domain_requests_site_idx on public.domain_requests(site_id);
create index if not exists domain_requests_status_idx on public.domain_requests(status);

alter table public.domain_requests enable row level security;

-- Owner (and admins) can read their own requests. Inserts/updates happen
-- through the service role (payment callback / admin), which bypasses RLS.
drop policy if exists "domain_requests owner read" on public.domain_requests;
create policy "domain_requests owner read" on public.domain_requests
  for select using (
    public.is_admin() or user_id = auth.uid()
  );
