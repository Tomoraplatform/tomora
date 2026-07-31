-- =============================================================
-- Tomora Resources: a public library of backgrounds, sections, landing
-- pages and full websites. Each resource ships an AI prompt and the HTML.
-- Free ones are open; paid ones unlock per resource after a single payment,
-- with no account needed (the buyer's email is the identity).
-- =============================================================

create extension if not exists "pgcrypto";

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  -- background | section | landing | website
  category text not null default 'section',
  tags text not null default '',
  prompt_text text not null default '',
  html_code text not null default '',
  -- Self-contained markup for the gallery/detail iframe preview.
  preview_html text not null default '',
  thumbnail_color text not null default '#022245',
  is_paid boolean not null default false,
  -- Naira. Set from the category default when the admin marks it paid.
  price integer not null default 0,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  views integer not null default 0,
  copies integer not null default 0,
  downloads integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists resources_category_idx on public.resources(category);
create index if not exists resources_published_idx on public.resources(is_published);

-- One row per paid resource per buyer. Access is granted by email, so a buyer
-- can return on any device through the link emailed to them.
create table if not exists public.resource_purchases (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  email text not null,
  name text,
  amount integer not null default 0,
  reference text,
  -- pending | paid
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists resource_purchases_email_idx on public.resource_purchases(lower(email));
create index if not exists resource_purchases_resource_idx on public.resource_purchases(resource_id);
-- A reference settles exactly once.
create unique index if not exists resource_purchases_reference_uidx
  on public.resource_purchases(reference) where reference is not null;
-- One paid unlock per buyer per resource.
create unique index if not exists resource_purchases_paid_uidx
  on public.resource_purchases(resource_id, lower(email)) where status = 'paid';

alter table public.resources enable row level security;
alter table public.resource_purchases enable row level security;

-- No policies: deny-all. RLS cannot restrict individual columns, so a public
-- select policy on `resources` would hand out prompt_text and html_code to
-- anyone holding the anon key. All reads go through the service-role client,
-- which strips the gated columns until the entitlement check passes.
