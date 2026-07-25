-- =============================================================
-- Custom domains for creator sales pages. Creators search for an
-- available name and pay the same assisted-domain price as sites;
-- an admin then registers it and connects it.
-- =============================================================

create extension if not exists "pgcrypto";

-- The live custom domain for a creator's pages (null = use /c/<slug>).
alter table public.academy_creators add column if not exists custom_domain text;
alter table public.academy_creators add column if not exists domain_status text not null default 'none';
create unique index if not exists academy_creators_custom_domain_uidx
  on public.academy_creators(custom_domain) where custom_domain is not null;

create table if not exists public.creator_domain_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.academy_creators(id) on delete cascade,
  domain text not null,
  amount integer not null,
  reference text,
  -- paid -> registered (bought at registrar) -> connected (live) | cancelled
  status text not null default 'paid',
  created_at timestamptz not null default now()
);
create index if not exists creator_domain_requests_creator_idx on public.creator_domain_requests(creator_id);
create index if not exists creator_domain_requests_status_idx on public.creator_domain_requests(status);

alter table public.creator_domain_requests enable row level security;
-- No policies: deny-all (service-role only).
