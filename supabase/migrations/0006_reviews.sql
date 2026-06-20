-- =============================================================
-- Product/business reviews + optional sale (compare-at) price
-- =============================================================

-- Compare-at / original price for showing discounts.
alter table public.products
  add column if not exists compare_price integer;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  reviewer_name text not null,
  reviewer_email text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists reviews_site_id_idx on public.reviews(site_id);

alter table public.reviews enable row level security;

-- Anyone can leave a review (public storefront).
drop policy if exists "reviews public insert" on public.reviews;
create policy "reviews public insert" on public.reviews
  for insert with check (true);

-- Published reviews are publicly readable (to show on the live store); the
-- site owner and admins can read all of their reviews.
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews
  for select using (
    is_published = true
    or public.is_admin()
    or exists (select 1 from public.sites s where s.id = reviews.site_id and s.user_id = auth.uid())
  );

-- Owner can update/delete (e.g., hide) their reviews.
drop policy if exists "reviews owner manage" on public.reviews;
create policy "reviews owner manage" on public.reviews
  for all using (
    exists (select 1 from public.sites s where s.id = reviews.site_id and s.user_id = auth.uid())
  );
