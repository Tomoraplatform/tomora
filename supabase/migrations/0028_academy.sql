-- =============================================================
-- Tomora Academy — non-downloadable course portal.
-- Separate student accounts; videos/slides in a private bucket
-- served via short-lived signed URLs (watched in-portal only).
-- All access goes through server code with the service-role client,
-- so RLS denies public access to every table below.
-- =============================================================

create extension if not exists "pgcrypto";

-- Courses -----------------------------------------------------
create table if not exists public.academy_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  short_description text,
  thumbnail_url text,
  price integer not null default 0,          -- naira; 0 = free
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Modules (sections) ------------------------------------------
create table if not exists public.academy_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists academy_modules_course_idx on public.academy_modules(course_id);

-- Lessons -----------------------------------------------------
create table if not exists public.academy_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.academy_modules(id) on delete cascade,
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  title text not null,
  -- storage paths within the private academy-media bucket (not public URLs)
  video_path text,
  slides_path text,
  duration_seconds integer,
  is_preview boolean not null default false, -- free lessons visible before purchase
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists academy_lessons_module_idx on public.academy_lessons(module_id);
create index if not exists academy_lessons_course_idx on public.academy_lessons(course_id);

-- Students (separate accounts) --------------------------------
create table if not exists public.academy_students (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  salt text not null,
  created_at timestamptz not null default now()
);

-- Sessions (custom cookie auth) -------------------------------
create table if not exists public.academy_sessions (
  token text primary key,
  student_id uuid not null references public.academy_students(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists academy_sessions_student_idx on public.academy_sessions(student_id);

-- Enrollments (course access) ---------------------------------
create table if not exists public.academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.academy_students(id) on delete cascade,
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  source text not null default 'purchase',   -- purchase | admin | free
  paystack_reference text,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);
create index if not exists academy_enrollments_student_idx on public.academy_enrollments(student_id);
create index if not exists academy_enrollments_course_idx on public.academy_enrollments(course_id);

-- Per-lesson completion (progress) ----------------------------
create table if not exists public.academy_progress (
  student_id uuid not null references public.academy_students(id) on delete cascade,
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

-- RLS: deny all public access; service-role (server) bypasses. ---
alter table public.academy_courses     enable row level security;
alter table public.academy_modules     enable row level security;
alter table public.academy_lessons     enable row level security;
alter table public.academy_students    enable row level security;
alter table public.academy_sessions    enable row level security;
alter table public.academy_enrollments enable row level security;
alter table public.academy_progress    enable row level security;

-- Private storage bucket for course media (videos + slides).
insert into storage.buckets (id, name, public)
values ('academy-media', 'academy-media', false)
on conflict (id) do nothing;

-- Public bucket for course thumbnails.
insert into storage.buckets (id, name, public)
values ('academy-thumbnails', 'academy-thumbnails', true)
on conflict (id) do nothing;
