-- =============================================================
-- Donation projects: tag each gift with the project it funds.
-- project_name is denormalized so records stay readable even if
-- the owner later renames or deletes the project in the editor.
-- =============================================================

alter table public.donations add column if not exists project_id text;
alter table public.donations add column if not exists project_name text;

create index if not exists donations_project_id_idx on public.donations(project_id);
