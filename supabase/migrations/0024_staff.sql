-- =============================================================
-- Staff accounts (Growth plan): an owner invites staff by email with a set of
-- permitted areas. When someone signs in with an invited email, RLS below
-- grants them scoped access to the owner's data.
-- Areas: orders | products | editor | messages | leads | reviews
-- =============================================================

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text,
  email text not null,
  phone text,
  areas text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists staff_owner_idx on public.staff_members(owner_id);
create index if not exists staff_email_idx on public.staff_members(lower(email));
-- One invite per email per owner.
create unique index if not exists staff_owner_email_uidx
  on public.staff_members(owner_id, lower(email));

alter table public.staff_members enable row level security;

-- Owners manage their own staff list.
drop policy if exists "staff owner all" on public.staff_members;
create policy "staff owner all" on public.staff_members
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Staff can read their own membership row (to resolve access on login).
drop policy if exists "staff self read" on public.staff_members;
create policy "staff self read" on public.staff_members
  for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------- helper functions (security definer, avoid RLS recursion) ----------

create or replace function public.staff_owner_ids(p_area text)
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select owner_id from public.staff_members
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and p_area = any(areas)
$$;

create or replace function public.staff_owner_ids_any()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select owner_id from public.staff_members
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- ---------- staff access policies ----------

-- Sites: any staff member can read the owner's sites; 'editor' staff can update
-- site content (editor, discounts, shipping, donation figures).
drop policy if exists "sites staff read" on public.sites;
create policy "sites staff read" on public.sites
  for select using (user_id in (select public.staff_owner_ids_any()));

drop policy if exists "sites staff editor update" on public.sites;
create policy "sites staff editor update" on public.sites
  for update using (user_id in (select public.staff_owner_ids('editor')));

-- Products: full manage for 'products' staff.
drop policy if exists "products staff all" on public.products;
create policy "products staff all" on public.products
  for all using (user_id in (select public.staff_owner_ids('products')))
  with check (user_id in (select public.staff_owner_ids('products')));

-- Orders: read + update (status changes) for 'orders' staff.
drop policy if exists "orders staff read" on public.orders;
create policy "orders staff read" on public.orders
  for select using (exists (
    select 1 from public.sites s
    where s.id = orders.site_id and s.user_id in (select public.staff_owner_ids('orders'))
  ));
drop policy if exists "orders staff update" on public.orders;
create policy "orders staff update" on public.orders
  for update using (exists (
    select 1 from public.sites s
    where s.id = orders.site_id and s.user_id in (select public.staff_owner_ids('orders'))
  ));

-- Leads: read for 'leads' staff.
drop policy if exists "leads staff read" on public.leads;
create policy "leads staff read" on public.leads
  for select using (exists (
    select 1 from public.sites s
    where s.id = leads.site_id and s.user_id in (select public.staff_owner_ids('leads'))
  ));

-- Support messages: read + reply for 'messages' staff.
drop policy if exists "support staff read" on public.support_messages;
create policy "support staff read" on public.support_messages
  for select using (exists (
    select 1 from public.sites s
    where s.id = support_messages.site_id and s.user_id in (select public.staff_owner_ids('messages'))
  ));
drop policy if exists "support staff insert" on public.support_messages;
create policy "support staff insert" on public.support_messages
  for insert with check (exists (
    select 1 from public.sites s
    where s.id = support_messages.site_id and s.user_id in (select public.staff_owner_ids('messages'))
  ));
drop policy if exists "support staff update" on public.support_messages;
create policy "support staff update" on public.support_messages
  for update using (exists (
    select 1 from public.sites s
    where s.id = support_messages.site_id and s.user_id in (select public.staff_owner_ids('messages'))
  ));

-- Reviews: moderate for 'reviews' staff.
drop policy if exists "reviews staff all" on public.reviews;
create policy "reviews staff all" on public.reviews
  for all using (exists (
    select 1 from public.sites s
    where s.id = reviews.site_id and s.user_id in (select public.staff_owner_ids('reviews'))
  ));
