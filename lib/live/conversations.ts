import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { readState, type ConversationState } from "./cart";
import { sendMessage } from "./provider";
import type { OutboundMessage } from "./messages";

/**
 * Conversation persistence and the outbound queue.
 *
 * Two jobs that must not be confused: replies to something the customer just
 * did are sent immediately, because they are waiting. Messages Tomora starts
 * (an order was packed, an order shipped) go through the outbox, because
 * nobody is waiting and a failed send has to survive to be retried.
 */

export interface Conversation {
  id: string;
  liveAccountId: string | null;
  state: ConversationState;
}

/** Loads a customer's conversation, creating it on first contact. */
export async function loadConversation(waId: string): Promise<Conversation> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("live_conversations").select("id, live_account_id, state").eq("customer_wa_id", waId).maybeSingle();

  if (data) {
    return { id: data.id, liveAccountId: data.live_account_id, state: readState(data.state) };
  }

  const { data: created } = await admin
    .from("live_conversations")
    .insert({ customer_wa_id: waId, state: {} })
    .select("id, live_account_id, state")
    .maybeSingle();

  // A racing first message may have created it a moment ago; either row is fine.
  if (!created) {
    const { data: again } = await admin
      .from("live_conversations").select("id, live_account_id, state").eq("customer_wa_id", waId).maybeSingle();
    if (again) return { id: again.id, liveAccountId: again.live_account_id, state: readState(again.state) };
    throw new Error("Could not open a conversation.");
  }
  return { id: created.id, liveAccountId: created.live_account_id, state: readState(created.state) };
}

export async function saveConversation(id: string, state: ConversationState, siteId?: string): Promise<void> {
  const admin = createAdminClient();
  let liveAccountId: string | null | undefined;
  if (siteId) {
    const { data } = await admin.from("live_accounts").select("id").eq("site_id", siteId).maybeSingle();
    liveAccountId = data?.id ?? null;
  }
  await admin
    .from("live_conversations")
    .update({
      state,
      last_message_at: new Date().toISOString(),
      ...(liveAccountId !== undefined ? { live_account_id: liveAccountId } : {}),
    })
    .eq("id", id);
}

/**
 * Records an inbound message, returning false when it has been seen before.
 *
 * Meta redelivers a webhook it did not get a 200 for quickly enough. Without
 * this a slow reply would make a customer's single tap add two items to their
 * cart.
 */
export async function claimInbound(conversationId: string, waMessageId: string, payload: unknown): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("live_messages").insert({
    conversation_id: conversationId,
    wa_message_id: waMessageId,
    direction: "in",
    payload,
  });
  // A unique violation on wa_message_id means this is a redelivery.
  return !error;
}

/** Sends replies now and logs them. Order is preserved: WhatsApp shows them as sent. */
export async function sendReplies(
  conversationId: string,
  to: string,
  messages: OutboundMessage[]
): Promise<void> {
  const admin = createAdminClient();
  for (const message of messages) {
    const res = await sendMessage(to, message);
    await admin.from("live_messages").insert({
      conversation_id: conversationId,
      wa_message_id: res.messageId || null,
      direction: "out",
      payload: { message, ok: res.ok, error: res.error || null },
    });
    // One failed message should not swallow the rest of the reply.
  }
}

/**
 * Queues a message for the cron drain. Used for anything the customer is not
 * waiting on.
 *
 * `dedupeKey` makes the queue idempotent: the same key is only ever queued
 * once, which is what lets a caller that fires per line item send one message
 * per order. Returns whether it was actually queued.
 */
export async function enqueue(
  to: string,
  message: OutboundMessage,
  opts?: { dedupeKey?: string; sendAfter?: Date }
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("live_outbox").insert({
    to_wa_id: to,
    payload: message,
    ...(opts?.dedupeKey ? { dedupe_key: opts.dedupeKey } : {}),
    ...(opts?.sendAfter ? { send_after: opts.sendAfter.toISOString() } : {}),
  });
  return !error;
}

/**
 * Empties a customer's cart once their payment is confirmed.
 *
 * The cart is deliberately kept from checkout until this moment, so a customer
 * who abandons the payment page comes back to their basket intact. Only a
 * settled payment clears it, and only the one it was made from.
 */
export async function clearCartAfterPayment(waId: string, reference: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("live_conversations").select("id, state").eq("customer_wa_id", waId).maybeSingle();
  if (!data) return;
  const state = readState(data.state);
  if (state.pendingReference !== reference) return; // they have moved on since
  await admin.from("live_conversations").update({
    state: { ...state, cart: [], screen: "home", pendingReference: undefined, buyer: state.buyer },
  }).eq("id", data.id);
}

/**
 * Queues a message and tries to send it straight away.
 *
 * The cron that drains the outbox runs once a day, which is the most the
 * hosting plan allows, and a customer should not wait that long to hear their
 * order shipped. So the queue is the durable record and the retry path, while
 * the send itself happens now. Never throws.
 */
export async function enqueueAndSend(
  to: string,
  message: OutboundMessage,
  opts?: { dedupeKey?: string }
): Promise<void> {
  try {
    const queued = await enqueue(to, message, opts);
    // Already queued under this key: another caller is handling it.
    if (!queued) return;
    await drainOutbox(5);
  } catch {
    // The row is written; the cron will pick it up.
  }
}

/** How many times a queued message is retried before it is left alone. */
export const MAX_OUTBOX_ATTEMPTS = 5;

/**
 * Sends what is due in the outbox. Returns what happened, for the cron route.
 *
 * Backs off exponentially so a WhatsApp outage does not turn into a tight retry
 * loop against their API.
 */
export async function drainOutbox(limit = 25): Promise<{ sent: number; failed: number }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("live_outbox")
    .select("id, to_wa_id, payload, attempts")
    .is("sent_at", null)
    .lt("attempts", MAX_OUTBOX_ATTEMPTS)
    .lte("send_after", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  let sent = 0;
  let failed = 0;
  for (const row of ((data as any[]) || [])) {
    const res = await sendMessage(row.to_wa_id, row.payload);
    if (res.ok) {
      await admin.from("live_outbox").update({ sent_at: new Date().toISOString() }).eq("id", row.id);
      sent += 1;
    } else {
      const attempts = (row.attempts || 0) + 1;
      const backoffMinutes = Math.min(60, 2 ** attempts);
      await admin.from("live_outbox").update({
        attempts,
        last_error: (res.error || "send failed").slice(0, 300),
        send_after: new Date(Date.now() + backoffMinutes * 60000).toISOString(),
      }).eq("id", row.id);
      failed += 1;
    }
  }
  return { sent, failed };
}
