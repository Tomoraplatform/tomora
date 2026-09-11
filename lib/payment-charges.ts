import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditPlatform } from "@/lib/creator/money";
import { verifyTransaction } from "@/lib/paystack";
import type { FeePolicy } from "@/lib/plan-fees";
import type { ChargeQuote } from "@/lib/platform-fee";

/**
 * One row per online payment saying what it was made of: what the merchant is
 * owed, Tomora's fee, and what the customer paid. Store orders are stored one
 * row per item, so these totals live here, once, keyed by the Paystack
 * reference, for orders and donations alike.
 */

export interface PaymentCharge {
  reference: string;
  kind: "order" | "donation";
  subtotal: number;
  platform_fee: number;
  passthrough_fee: number;
  total_charged: number;
  status: string;
}

/**
 * Writes the record before the customer is sent to Paystack. A failure is
 * logged and the payment goes ahead: Paystack still splits the fee correctly,
 * only Tomora's own record of it is missing.
 */
export async function recordPaymentCharge(input: {
  reference: string;
  kind: "order" | "donation";
  siteId: string;
  ownerId: string;
  policy: FeePolicy;
  quote: ChargeQuote;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("payment_charges").insert({
    reference: input.reference,
    kind: input.kind,
    site_id: input.siteId,
    owner_id: input.ownerId,
    plan_id: input.policy.planId,
    fee_percent: input.policy.rate.percent,
    fee_flat: input.policy.rate.flat,
    subtotal: input.quote.subtotal,
    platform_fee: input.quote.platformFee,
    passthrough_fee: input.quote.passthroughFee,
    total_charged: input.quote.totalCharged,
    status: "pending",
  });
  if (error) console.error(`[fees] could not record the charge for ${input.reference}:`, error.message);
}

/**
 * Marks a payment's charge paid and books Tomora's fee.
 *
 * Called only on the flip from pending to paid, which already happens once per
 * reference; the wallet's unique (type, reference, source) index backs that up.
 * Returns the charge, or null for a payment made without one (before the fee
 * existed, or in the sandbox).
 */
export async function settlePaymentCharge(reference: string): Promise<PaymentCharge | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("payment_charges").select("*").eq("reference", reference).maybeSingle();
  const charge = data as PaymentCharge | null;
  if (!charge) return null;
  if (charge.status === "paid") return charge;

  // Paystack's own account of the split, so the fee can be checked against
  // what actually arrived rather than what was asked for.
  let split: { integration: number | null; subaccount: number | null; paystack: number | null } | undefined;
  try {
    split = (await verifyTransaction(reference)).split;
  } catch { /* best-effort: the fee is booked either way */ }

  await admin.from("payment_charges").update({
    status: "paid",
    paid_at: new Date().toISOString(),
    split_integration: split?.integration ?? null,
    split_subaccount: split?.subaccount ?? null,
    split_paystack: split?.paystack ?? null,
  }).eq("reference", reference);

  if (split?.integration != null && Math.round(split.integration) !== charge.platform_fee) {
    console.error(
      `[fees] ${reference}: Tomora should have received ₦${charge.platform_fee} but Paystack reports ₦${split.integration}`,
    );
  }

  if (charge.platform_fee > 0) {
    await creditPlatform({
      source: "transaction_fee",
      amount: charge.platform_fee,
      reference,
      description: `Transaction fee on ${charge.kind === "donation" ? "donation" : "order"} ${reference}`,
    });
  }
  return { ...charge, status: "paid" };
}
