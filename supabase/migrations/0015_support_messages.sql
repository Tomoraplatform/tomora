-- =============================================================
-- Support chat: visitor <-> site owner messages from the chat widget
-- =============================================================

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  conversation_id uuid not null,        -- groups a visitor's thread (acts as the visitor's secret token)
  sender text not null default 'visitor', -- visitor | owner
  name text,
  email text,
  body text not null,
  seen boolean not null default false,  -- whether the owner has read this visitor message
  created_at timestamptz not null default now()
);
create index if not exists support_messages_site_id_idx on public.support_messages(site_id);
create index if not exists support_messages_conversation_idx on public.support_messages(conversation_id);

alter table public.support_messages enable row level security;

-- Anyone can send a message from a published site's chat widget.
drop policy if exists "support public insert" on public.support_messages;
create policy "support public insert" on public.support_messages
  for insert with check (true);

-- Only the site owner (and admins) can read their messages.
drop policy if exists "support owner read" on public.support_messages;
create policy "support owner read" on public.support_messages
  for select using (
    public.is_admin()
    or exists (select 1 from public.sites s where s.id = support_messages.site_id and s.user_id = auth.uid())
  );

drop policy if exists "support owner manage" on public.support_messages;
create policy "support owner manage" on public.support_messages
  for all using (
    exists (select 1 from public.sites s where s.id = support_messages.site_id and s.user_id = auth.uid())
  );
