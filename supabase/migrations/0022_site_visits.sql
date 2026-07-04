-- =============================================================
-- Lightweight website-visit counter per site (powers the visit milestones).
-- =============================================================

alter table public.sites add column if not exists visit_count bigint not null default 0;

-- Atomic increment used by the /api/track-visit beacon (service role).
create or replace function public.increment_site_visit(p_site_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.sites set visit_count = visit_count + 1 where id = p_site_id;
$$;
