-- =============================================================
-- Tomora Academy — discount coupons + admin-managed course reviews.
-- RLS deny-all; all access via the service-role client in server code.
-- =============================================================

create extension if not exists "pgcrypto";

-- Discount coupons applied at course checkout.
create table if not exists public.academy_coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                       -- stored uppercase
  discount_type text not null default 'percent',   -- percent | fixed
  discount_value integer not null default 0,        -- percent (0-100) or naira
  course_id uuid references public.academy_courses(id) on delete cascade,  -- null = any course
  max_uses integer,                                 -- null = unlimited
  used_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,                           -- null = never
  created_at timestamptz not null default now()
);
create index if not exists academy_coupons_code_idx on public.academy_coupons(code);

-- Admin-entered course reviews (from offline students).
create table if not exists public.academy_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  author_name text not null,
  rating integer not null default 5,                -- 1..5
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists academy_reviews_course_idx on public.academy_reviews(course_id);

alter table public.academy_coupons enable row level security;
alter table public.academy_reviews enable row level security;
-- No policies: deny-all.
