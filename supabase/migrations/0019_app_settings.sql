-- =============================================================
-- Single-row app settings (admin) — e.g. the revenue reset point
-- =============================================================

create table if not exists public.app_settings (
  id integer primary key default 1,
  revenue_reset_at timestamptz,
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;
-- No public policies — only the service role (admin actions) reads/writes this.
