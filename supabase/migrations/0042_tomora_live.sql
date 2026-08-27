-- =============================================================
-- Tomora Live: the store, inside WhatsApp.
--
-- Deliberately additive. Products, sites, profiles, wallets and the ledger are
-- reused exactly as they are; an order placed in WhatsApp writes the same order
-- rows a website order does, so it appears in the seller's existing dashboard
-- with no changes there.
--
-- RLS deny-all; all access goes through the service-role client in server code.
-- =============================================================

create extension if not exists "pgcrypto";

-- The seller's Live presence. One per site.
--
-- Customers all message one shared Tomora number, so the routing key is the
-- store_code the customer arrives with (wa.me/<number>?text=SHOP%20ADEBAYO),
-- not the phone number they messaged. phone_number_id is recorded anyway so
-- that moving a seller onto their own number later is a data change, not a
-- rewrite.
create table if not exists public.live_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade unique,
  store_code text not null unique,                  -- uppercase, what customers type
  phone_number_id text,                             -- set only when on a dedicated number
  waba_id text,
  display_phone text,
  status text not null default 'active',            -- active | paused
  greeting text,                                    -- overrides the default welcome
  activated_at timestamptz not null default now()
);
create index if not exists live_accounts_user_idx on public.live_accounts(user_id);
create index if not exists live_accounts_code_idx on public.live_accounts(store_code);

-- One row per customer conversation. `state` holds the current screen and the
-- cart: the cart lives here on the server, never in a message the customer
-- could edit and send back.
create table if not exists public.live_conversations (
  id uuid primary key default gen_random_uuid(),
  live_account_id uuid references public.live_accounts(id) on delete cascade,
  customer_wa_id text not null,                     -- the customer's phone, E.164 digits
  state jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (customer_wa_id)
);
create index if not exists live_conversations_account_idx on public.live_conversations(live_account_id);

-- Inbound and outbound message log. wa_message_id is unique so a webhook
-- redelivery is recognised and ignored rather than replayed.
create table if not exists public.live_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.live_conversations(id) on delete cascade,
  wa_message_id text unique,
  direction text not null,                          -- in | out
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists live_messages_conversation_idx on public.live_messages(conversation_id);

-- Outbound queue. Vercel has no worker, so a cron route drains this: a status
-- message that fails to send retries instead of vanishing.
create table if not exists public.live_outbox (
  id uuid primary key default gen_random_uuid(),
  to_wa_id text not null,
  payload jsonb not null,
  -- An order is stored as one row per line item, so marking a 3-item order
  -- shipped calls the update three times. A unique key like
  -- "tomwa_123:shipped" is what stops the customer getting three messages.
  dedupe_key text unique,
  attempts integer not null default 0,
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists live_outbox_pending_idx on public.live_outbox(sent_at, send_after);

alter table public.live_accounts enable row level security;
alter table public.live_conversations enable row level security;
alter table public.live_messages enable row level security;
alter table public.live_outbox enable row level security;
-- No policies: deny-all.

-- ---------- extensions to existing tables ----------

-- Where the order came from, so the dashboard can label it and Live's
-- commission only ever applies to Live's own sales.
alter table public.orders add column if not exists channel text not null default 'web';
alter table public.orders add column if not exists live_conversation_id uuid;

-- The seller's fulfilment flow needs a step between paid and shipped.
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'order_status' and e.enumlabel = 'packed'
  ) then
    alter type order_status add value 'packed' after 'paid';
  end if;
end $$;
