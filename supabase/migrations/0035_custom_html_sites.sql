-- =============================================================
-- Custom HTML sites: host a hand-built, self-contained HTML page on a
-- Tomora subdomain instead of a template. The file lives in storage and
-- the site row points at it, so page renders stay light.
-- =============================================================

alter table public.sites add column if not exists custom_html_url text;

-- Public bucket for uploaded site HTML.
insert into storage.buckets (id, name, public)
values ('site-html', 'site-html', true)
on conflict (id) do nothing;
