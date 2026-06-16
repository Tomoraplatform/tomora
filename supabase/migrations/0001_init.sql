-- =============================================================
-- Tomora — initial schema
-- Run in the Supabase SQL editor, or via `supabase db push`.
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type site_category as enum ('business','ecommerce','creator','organization');
exception when duplicate_object then null; end $$;

do $$ begin
  create type domain_status as enum ('none','pending','verifying','active','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active','past_due','cancelled','none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending','paid','shipped','delivered');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text,
  tagline text,
  logo_url text,
  brand_color text default '#022245',
  phone text,
  email text,
  address text,
  social_links jsonb default '{}'::jsonb,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- sites ----------
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  category site_category not null,
  subdomain text not null unique,
  custom_domain text unique,
  domain_status domain_status not null default 'none',
  is_live boolean not null default false,
  trial_ends_at timestamptz,
  site_data jsonb not null default '{}'::jsonb,
  paystack_public_key text,
  created_at timestamptz not null default now()
);
create index if not exists sites_user_id_idx on public.sites(user_id);
create index if not exists sites_subdomain_idx on public.sites(subdomain);
create index if not exists sites_custom_domain_idx on public.sites(custom_domain);

-- ---------- subscriptions ----------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paystack_subscription_code text,
  status subscription_status not null default 'none',
  billing_cycle_position integer not null default 0 check (billing_cycle_position between 0 and 3),
  first_payment_amount integer not null default 30000,
  renewal_amount integer not null default 22500,
  next_billing_date timestamptz,
  last_payment_date timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  description text,
  price integer not null default 0,
  images jsonb not null default '[]'::jsonb,
  category text,
  stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_site_id_idx on public.products(site_id);
create index if not exists products_user_id_idx on public.products(user_id);

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  buyer_address text,
  amount integer not null default 0,
  paystack_reference text,
  status order_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists orders_site_id_idx on public.orders(site_id);

-- ---------- domains ----------
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  domain_name text not null unique,
  registrar_reference text,
  status domain_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists domains_user_id_idx on public.domains(user_id);

-- =============================================================
-- Auto-create a profile row when a new auth user signs up
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, business_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.profiles      enable row level security;
alter table public.sites          enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.domains        enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where user_id = auth.uid()), false);
$$;

-- ---- profiles ----
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "profiles self upsert" on public.profiles;
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- sites ----
-- Public can read LIVE sites (needed to render published subdomains via anon).
drop policy if exists "sites public read live" on public.sites;
create policy "sites public read live" on public.sites
  for select using (is_live = true or auth.uid() = user_id or public.is_admin());
drop policy if exists "sites owner insert" on public.sites;
create policy "sites owner insert" on public.sites
  for insert with check (auth.uid() = user_id);
drop policy if exists "sites owner update" on public.sites;
create policy "sites owner update" on public.sites
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "sites owner delete" on public.sites;
create policy "sites owner delete" on public.sites
  for delete using (auth.uid() = user_id);

-- ---- subscriptions ----
drop policy if exists "subscriptions self read" on public.subscriptions;
create policy "subscriptions self read" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "subscriptions self write" on public.subscriptions;
create policy "subscriptions self write" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- products ----
-- Public can read active products for live storefronts.
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (is_active = true or auth.uid() = user_id or public.is_admin());
drop policy if exists "products owner write" on public.products;
create policy "products owner write" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- orders ----
-- Anyone can create an order (public checkout). Owner of the site can read/update.
drop policy if exists "orders public insert" on public.orders;
create policy "orders public insert" on public.orders
  for insert with check (true);
drop policy if exists "orders owner read" on public.orders;
create policy "orders owner read" on public.orders
  for select using (
    public.is_admin() or
    exists (select 1 from public.sites s where s.id = orders.site_id and s.user_id = auth.uid())
  );
drop policy if exists "orders owner update" on public.orders;
create policy "orders owner update" on public.orders
  for update using (
    exists (select 1 from public.sites s where s.id = orders.site_id and s.user_id = auth.uid())
  );

-- ---- domains ----
drop policy if exists "domains self read" on public.domains;
create policy "domains self read" on public.domains
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "domains self write" on public.domains;
create policy "domains self write" on public.domains
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- Storage buckets (logos + product images, public read)
-- =============================================================
insert into storage.buckets (id, name, public)
  values ('branding', 'branding', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('products', 'products', true)
  on conflict (id) do nothing;

drop policy if exists "branding public read" on storage.objects;
create policy "branding public read" on storage.objects
  for select using (bucket_id in ('branding','products'));

drop policy if exists "branding auth write" on storage.objects;
create policy "branding auth write" on storage.objects
  for insert to authenticated with check (bucket_id in ('branding','products'));

drop policy if exists "branding auth update" on storage.objects;
create policy "branding auth update" on storage.objects
  for update to authenticated using (bucket_id in ('branding','products'));

drop policy if exists "branding auth delete" on storage.objects;
create policy "branding auth delete" on storage.objects
  for delete to authenticated using (bucket_id in ('branding','products'));
