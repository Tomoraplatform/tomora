-- =============================================================
-- Bright Mind — team management dashboard
-- Self-contained key/value store for the Bright Mind app. Every read and
-- write goes through the service-role API route (app/api/bright-mind), so
-- the table needs no public policies — the anon key can never touch it.
-- =============================================================

create table if not exists public.bright_mind_kv (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Lets the API list every member with a single prefix scan (bm_user:*).
create index if not exists bright_mind_kv_key_prefix_idx
  on public.bright_mind_kv (key text_pattern_ops);

alter table public.bright_mind_kv enable row level security;
-- No policies on purpose: only the service role (server-side API) may read or
-- write. RLS-enabled + zero policies => the anon/public key is fully denied.
