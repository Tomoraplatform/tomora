-- ════════════════════════════════════════════════════════════════════
-- Make Extra Income with Claude AI — schema
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ───────────────────────── students ─────────────────────────
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  approved_status boolean not null default false,
  payment_status text not null default 'pending', -- pending | paid | failed | manual
  payment_provider text,
  paystack_customer_code text,
  paystack_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_students_updated before update on public.students
  for each row execute function public.set_updated_at();

-- ──────────────────── payment_transactions ──────────────────
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  full_name text not null,
  email text not null,
  provider text not null default 'paystack',
  reference text not null unique,
  amount numeric not null default 0,           -- major units (e.g. naira)
  currency text not null default 'NGN',
  status text not null default 'pending',       -- pending | success | failed
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_tx_updated before update on public.payment_transactions
  for each row execute function public.set_updated_at();

-- ───────────────────────── modules ──────────────────────────
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  module_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_modules_updated before update on public.modules
  for each row execute function public.set_updated_at();

-- ───────────────────────── lessons ──────────────────────────
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  lesson_order int not null default 0,
  lesson_type text not null default 'video',   -- welcome | video | worksheet
  video_embed_url text,
  pdf_view_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_lessons_updated before update on public.lessons
  for each row execute function public.set_updated_at();

-- ────────────────────── lesson_progress ─────────────────────
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);
create trigger trg_progress_updated before update on public.lesson_progress
  for each row execute function public.set_updated_at();

-- ────────────────────── module_feedback ─────────────────────
create table if not exists public.module_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  biggest_takeaway text not null,
  where_stuck text,
  question_for_expert text,
  created_at timestamptz not null default now(),
  unique (student_id, module_id)
);

-- ──────────────────────── admin_users ───────────────────────
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_admin_updated before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ──────────────────────── app_settings ──────────────────────
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_settings_updated before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ──────────────────────── webhook_events ────────────────────
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paystack',
  event_type text,
  reference text,
  raw_payload jsonb,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_lessons_module on public.lessons(module_id);
create index if not exists idx_progress_student on public.lesson_progress(student_id);
create index if not exists idx_feedback_student on public.module_feedback(student_id);

-- ════════════════════════════════════════════════════════════════════
-- Helper: is the current authed user an approved student?
-- ════════════════════════════════════════════════════════════════════
create or replace function public.current_student_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.students
  where email = lower(auth.jwt() ->> 'email')
    and approved_status = true
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(auth.jwt() ->> 'email')
  );
$$;

-- ════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.students            enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.modules             enable row level security;
alter table public.lessons             enable row level security;
alter table public.lesson_progress     enable row level security;
alter table public.module_feedback     enable row level security;
alter table public.admin_users         enable row level security;
alter table public.app_settings        enable row level security;
alter table public.webhook_events      enable row level security;

-- students: a student sees only their own row; admins see all.
create policy students_select_self on public.students
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.is_admin());

-- course content: any approved authenticated student (or admin) may read.
create policy modules_select on public.modules
  for select to authenticated
  using (public.current_student_id() is not null or public.is_admin());

create policy lessons_select on public.lessons
  for select to authenticated
  using (public.current_student_id() is not null or public.is_admin());

create policy settings_select on public.app_settings
  for select to authenticated
  using (true);

-- lesson_progress: students manage only their own progress.
create policy progress_select on public.lesson_progress
  for select to authenticated
  using (student_id = public.current_student_id() or public.is_admin());

create policy progress_insert on public.lesson_progress
  for insert to authenticated
  with check (student_id = public.current_student_id());

create policy progress_update on public.lesson_progress
  for update to authenticated
  using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id());

-- module_feedback: students submit/read only their own.
create policy feedback_select on public.module_feedback
  for select to authenticated
  using (student_id = public.current_student_id() or public.is_admin());

create policy feedback_insert on public.module_feedback
  for insert to authenticated
  with check (student_id = public.current_student_id());

-- admin_users / payment_transactions / webhook_events:
-- no anon/authenticated policies => only the service role (server) can touch them.
-- (Service role bypasses RLS entirely.)
