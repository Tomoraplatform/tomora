-- =============================================================
-- Admin overrides for catalog templates: rename, archive, remove.
-- One row per catalog template id (only templates the admin has touched).
-- =============================================================

create table if not exists public.template_settings (
  template_id text primary key,
  display_name text,
  archived boolean not null default false,
  removed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.template_settings enable row level security;

-- Anyone can read (onboarding needs it to hide/rename templates); only the
-- service role (admin server actions) writes.
drop policy if exists "template_settings public read" on public.template_settings;
create policy "template_settings public read" on public.template_settings for select using (true);
