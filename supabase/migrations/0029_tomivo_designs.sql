-- =============================================================
-- Tomora AI — Designs gallery ("tomivo").
-- Animated landing pages, backgrounds and gradients. Everyone can
-- preview; the prompt/HTML/CSS of PREMIUM designs is served only to
-- active subscribers (checked in server code, RLS denies all here).
-- Accounts are the shared Tomora account (academy_students).
-- =============================================================

create extension if not exists "pgcrypto";

create table if not exists public.tomivo_designs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null default '',
  category text not null default 'landing-page',   -- landing-page | animated-background | gradient
  tags text not null default '',                    -- comma-separated
  prompt_text text not null default '',
  html_code text not null default '',
  css_code text not null default '',
  preview_html text not null default '',            -- self-contained HTML for the sandboxed iframe preview
  thumbnail_color text not null default '#0a0a0a',
  is_featured boolean not null default false,
  is_premium boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  views integer not null default 0,
  copies integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tomivo_designs_category_idx on public.tomivo_designs(category);

-- Period-based subscriptions (pay once per period; monthly = +30d, yearly = +365d).
create table if not exists public.tomivo_subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.academy_students(id) on delete cascade,
  plan text not null default 'monthly',             -- monthly | yearly
  status text not null default 'active',            -- active | expired
  current_period_end timestamptz not null,
  paystack_reference text,
  created_at timestamptz not null default now(),
  unique (student_id)
);
create index if not exists tomivo_subscriptions_student_idx on public.tomivo_subscriptions(student_id);

-- Pre-launch / marketing email capture.
create table if not exists public.tomivo_signups (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.tomivo_designs enable row level security;
alter table public.tomivo_subscriptions enable row level security;
alter table public.tomivo_signups enable row level security;
-- No policies: deny-all. All access is via the service-role client in server code.
