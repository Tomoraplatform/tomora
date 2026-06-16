import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  nextCharge, RENEWAL_INTERVAL_MONTHS, FIRST_PAYMENT_AMOUNT, RENEWAL_AMOUNT, GRACE_PERIOD_DAYS,
} from "@/lib/constants";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Records a successful platform payment and advances the billing cycle.
 * Idempotent on `reference`. Activates the user's site.
 */
export async function applyPlatformPayment(userId: string, reference: string) {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (sub?.last_reference === reference) return { already: true };

  const position = sub?.billing_cycle_position ?? 0;
  const result = nextCharge(position);
  const now = new Date();
  const nextBilling = addMonths(now, RENEWAL_INTERVAL_MONTHS);

  const payload = {
    user_id: userId,
    status: "active" as const,
    billing_cycle_position: result.nextPosition,
    first_payment_amount: FIRST_PAYMENT_AMOUNT,
    renewal_amount: RENEWAL_AMOUNT,
    next_billing_date: nextBilling.toISOString(),
    last_payment_date: now.toISOString(),
    last_reference: reference,
  };

  if (sub) {
    await admin.from("subscriptions").update(payload).eq("id", sub.id);
  } else {
    await admin.from("subscriptions").insert(payload);
  }

  // Re-activate the site and clear the trial gate.
  await admin.from("sites").update({ is_live: true }).eq("user_id", userId);

  // First payment of a cycle includes a year of custom domain.
  if (result.includesDomain) {
    const expires = addMonths(now, 12).toISOString();
    await admin
      .from("domains")
      .update({ expires_at: expires })
      .eq("user_id", userId);
  }

  return { already: false, chargedPosition: position, newPosition: result.nextPosition };
}

/**
 * Handles a failed/declined platform payment. Marks the subscription past_due
 * and, once the grace period has elapsed, takes the site offline.
 */
export async function applyPaymentFailure(userId: string) {
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  await admin
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("user_id", userId);

  // If the last successful payment is older than the grace period, go offline.
  const last = sub?.last_payment_date ? new Date(sub.last_payment_date).getTime() : 0;
  const graceMs = GRACE_PERIOD_DAYS * 86400000;
  if (!last || Date.now() - last > graceMs) {
    await admin.from("sites").update({ is_live: false }).eq("user_id", userId);
  }
}

export async function disableSubscription(userId: string) {
  const admin = createAdminClient();
  await admin.from("subscriptions").update({ status: "cancelled" }).eq("user_id", userId);
  await admin.from("sites").update({ is_live: false }).eq("user_id", userId);
}
