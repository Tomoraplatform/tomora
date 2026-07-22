-- =============================================================
-- Tomora Academy — "coming soon" courses + notify-me waitlist.
-- Also seeds the first coming-soon course (MVP with Claude), so
-- no separate seeding step is needed.
-- =============================================================

alter table public.academy_courses add column if not exists is_coming_soon boolean not null default false;
-- Lesson count to display while the course has no real lessons yet.
alter table public.academy_courses add column if not exists coming_soon_lessons integer not null default 0;

create table if not exists public.academy_notify_requests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academy_courses(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (course_id, email)
);
create index if not exists academy_notify_course_idx on public.academy_notify_requests(course_id);

alter table public.academy_notify_requests enable row level security;
-- No policies: deny-all (service-role only).

-- Seed the coming-soon course (idempotent on slug).
insert into public.academy_courses
  (title, slug, short_description, thumbnail_url, price, is_published, is_coming_soon, coming_soon_lessons, sort_order)
values (
  'How to Create and Launch Your MVP Product with Claude',
  'mvp-with-claude',
  'From idea to a live product people can pay for. Build it, test it and launch it with Claude, step by step.',
  'https://www.tomora.com.ng/academy-mvp-banner.jpg',
  0, true, true, 25, 3
)
on conflict (slug) do nothing;
