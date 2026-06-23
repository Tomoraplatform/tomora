-- =============================================================
-- Donations: online giving for organisation / community sites
-- =============================================================

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  donor_name text,
  donor_email text,
  amount integer not null,             -- naira
  paystack_reference text,
  status text not null default 'pending', -- pending | paid
  created_at timestamptz not null default now()
);
create index if not exists donations_site_id_idx on public.donations(site_id);

alter table public.donations enable row level security;

-- Anyone can start a donation from a published site.
drop policy if exists "donations public insert" on public.donations;
create policy "donations public insert" on public.donations
  for insert with check (true);

-- Only the site owner (and admins) can read their donations.
drop policy if exists "donations owner read" on public.donations;
create policy "donations owner read" on public.donations
  for select using (
    public.is_admin()
    or exists (select 1 from public.sites s where s.id = donations.site_id and s.user_id = auth.uid())
  );
