-- =============================================================
-- Nova (AI setup assistant) kill-switch. Off by default; an admin
-- turns it on from the admin dashboard when ready to launch.
-- =============================================================

alter table public.app_settings add column if not exists nova_enabled boolean not null default false;
