-- =============================================================
-- Tomora Academy — creator marketplace (Phase 1).
-- Academy students can become creators: author profile, their own
-- courses (modules + lessons), sold on their own sales page at
-- /c/<slug>. These courses do NOT appear in the main Academy
-- catalog unless an admin approves them (featured_at set).
-- RLS deny-all; all access via service-role in server code.
-- =============================================================

create extension if not exists "pgcrypto";

-- One creator profile per academy student ------------------------
create table if not exists public.academy_creators (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.academy_students(id) on delete cascade,
  -- Public handle used in the sales page URL: /c/<slug>
  slug text unique not null,
  author_name text not null,
  author_bio text not null default '',
  author_photo_url text,
  /** Show the author avatar + "About the author" on their sales pages. */
  show_author boolean not null default true,
  -- Brand for their sales pages (max two colours per the spec).
  brand_name text,
  logo_url text,
  brand_color text not null default '#022245',
  brand_color_2 text not null default '#10B981',
  -- Payout details for withdrawals (Phase 2 wallet).
  bank_name text,
  bank_code text,
  account_number text,
  account_name text,
  created_at timestamptz not null default now(),
  unique (student_id)
);
create index if not exists academy_creators_slug_idx on public.academy_creators(slug);

-- Creator courses ----------------------------------------------
create table if not exists public.creator_courses (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.academy_creators(id) on delete cascade,
  title text not null,
  slug text not null,                       -- unique per creator
  description text not null default '',
  -- Compulsory: shown to their students and on the sales page.
  banner_url text,
  price integer not null default 0,         -- naira
  compare_price integer,                    -- optional "slashed" price
  is_published boolean not null default false,
  is_active boolean not null default true,  -- creator can pause a course
  -- Sales page design (sections/elements), edited in the page builder.
  sales_page jsonb not null default '{}'::jsonb,
  -- Admin approval to surface on the main Tomora Academy catalog.
  featured_at timestamptz,
  purchases integer not null default 0,
  created_at timestamptz not null default now(),
  unique (creator_id, slug)
);
create index if not exists creator_courses_creator_idx on public.creator_courses(creator_id);

create table if not exists public.creator_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.creator_courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists creator_modules_course_idx on public.creator_modules(course_id);

-- Lessons: uploaded video (small), external link (YouTube/Vimeo/Drive) or PDF.
create table if not exists public.creator_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.creator_modules(id) on delete cascade,
  course_id uuid not null references public.creator_courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  lesson_type text not null default 'link',   -- video | link | pdf
  -- Storage path in the private creator-media bucket (video/pdf).
  media_path text,
  -- External URL for link lessons.
  media_url text,
  is_preview boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists creator_lessons_course_idx on public.creator_lessons(course_id);

-- Enrollments in creator courses (shared academy student accounts).
create table if not exists public.creator_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.academy_students(id) on delete cascade,
  course_id uuid not null references public.creator_courses(id) on delete cascade,
  source text not null default 'purchase',   -- purchase | admin | free
  paystack_reference text,
  amount_paid integer not null default 0,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);
create index if not exists creator_enrollments_course_idx on public.creator_enrollments(course_id);

create table if not exists public.creator_progress (
  student_id uuid not null references public.academy_students(id) on delete cascade,
  lesson_id uuid not null references public.creator_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

-- Per-course discount coupons set by the creator.
create table if not exists public.creator_coupons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.creator_courses(id) on delete cascade,
  code text not null,
  discount_type text not null default 'percent',   -- percent | fixed
  discount_value integer not null default 0,
  max_uses integer,
  used_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (course_id, code)
);

-- Shared handle registry so creator slugs can't collide with site
-- subdomains (and vice versa) even though they live on different paths.
create table if not exists public.reserved_handles (
  handle text primary key,
  kind text not null,          -- site | creator
  created_at timestamptz not null default now()
);

alter table public.academy_creators enable row level security;
alter table public.creator_courses enable row level security;
alter table public.creator_modules enable row level security;
alter table public.creator_lessons enable row level security;
alter table public.creator_enrollments enable row level security;
alter table public.creator_progress enable row level security;
alter table public.creator_coupons enable row level security;
alter table public.reserved_handles enable row level security;
-- No policies: deny-all (service-role only).

-- Private bucket for creator lesson media (signed URLs only).
insert into storage.buckets (id, name, public)
values ('creator-media', 'creator-media', false)
on conflict (id) do nothing;

-- Public bucket for banners / logos / author photos.
insert into storage.buckets (id, name, public)
values ('creator-public', 'creator-public', true)
on conflict (id) do nothing;
