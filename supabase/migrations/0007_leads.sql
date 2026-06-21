-- =============================================================
-- Lead capture: contact-form & newsletter submissions on sites
-- =============================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text,
  email text,
  phone text,
  message text,
  source text not null default 'contact', -- contact | newsletter | register
  created_at timestamptz not null default now()
);
create index if not exists leads_site_id_idx on public.leads(site_id);

alter table public.leads enable row level security;

-- Anyone can submit a lead through a published site form.
drop policy if exists "leads public insert" on public.leads;
create policy "leads public insert" on public.leads
  for insert with check (true);

-- Only the site owner (and admins) can read/manage their leads.
drop policy if exists "leads owner read" on public.leads;
create policy "leads owner read" on public.leads
  for select using (
    public.is_admin()
    or exists (select 1 from public.sites s where s.id = leads.site_id and s.user_id = auth.uid())
  );

drop policy if exists "leads owner manage" on public.leads;
create policy "leads owner manage" on public.leads
  for all using (
    exists (select 1 from public.sites s where s.id = leads.site_id and s.user_id = auth.uid())
  );
