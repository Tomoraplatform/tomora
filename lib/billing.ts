import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  nextCharge, RENEWAL_INTERVAL_MONTHS, FIRST_PAYMENT_AMOUNT, RENEWAL_AMOUNT, GRACE_PERIOD_DAYS,
  getPlan,
} from "@/lib/constants";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Records a successful platform payment, sets the plan, and (for Pro) advances
 * the 4-month billing cycle. Monthly plans renew every month. Idempotent on
 * `reference`. Activates the user's site.
 */
export async function applyPlatformPayment(userId: string, reference: string, planId?: string) {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (sub?.last_reference === reference) return { already: true };

  const plan = getPlan(planId || sub?.plan || "pro");
  const isPro = plan?.id === "pro";
  const now = new Date();

  // Pro keeps the 0-3 cycle; monthly plans stay at position 0.
  const position = sub?.billing_cycle_position ?? 0;
  const result = isPro ? nextCharge(position) : { nextPosition: 0, includesDomain: !!plan?.includesDomain };
  const nextBilling = addMonths(now, isPro ? RENEWAL_INTERVAL_MONTHS : 1);

  const payload = {
    user_id: userId,
    status: "active" as const,
    plan: plan?.id || "pro",
    billing_cycle_position: result.nextPosition,
    first_payment_amount: plan?.price ?? FIRST_PAYMENT_AMOUNT,
    renewal_amount: plan?.renewal ?? plan?.price ?? RENEWAL_AMOUNT,
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

  // Plans that include a domain extend it for a year on the qualifying payment.
  if (result.includesDomain) {
    const expires = addMonths(now, 12).toISOString();
    await admin.from("domains").update({ expires_at: expires }).eq("user_id", userId);
  }

  return { already: false };
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

/** Marks a site as having paid for an extra custom domain. */
export async function applyDomainPurchase(userId: string, siteId: string) {
  const admin = createAdminClient();
  await admin
    .from("sites")
    .update({ domain_purchased: true })
    .eq("id", siteId)
    .eq("user_id", userId);
}
