-- =============================================================
-- Tracing an outreach email after it leaves Tomora.
--
-- "Sent" only ever meant the mail service accepted it. These columns keep the
-- provider's id for each message so the admin screen can ask what actually
-- happened to it: delivered, bounced, or marked as spam.
-- =============================================================

alter table public.outreach_messages
  add column if not exists message_id text;

alter table public.outreach_messages
  add column if not exists delivery text;

alter table public.outreach_messages
  add column if not exists delivery_checked_at timestamptz;
