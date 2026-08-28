import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueAndSend } from "./conversations";
import { text } from "./messages";

/**
 * Automated order updates to the customer, with no typing from the seller.
 *
 * The seller changes a status in the dashboard exactly as they always have;
 * this notices when that order came from WhatsApp and tells the customer.
 */

const STATUS_MESSAGE: Record<string, (ref: string) => string> = {
  paid: (ref) => `✅ Payment confirmed for order *${ref}*. The seller is preparing it now.`,
  packed: (ref) => `📦 Your order *${ref}* has been packed and is ready to go out.`,
  shipped: (ref) => `🚚 Your order *${ref}* is on its way to you.`,
  delivered: (ref) => `🎉 Your order *${ref}* has been delivered. Thank you for shopping with us!`,
};

/**
 * Tells a WhatsApp customer their order moved on.
 *
 * Safe to call for any order: it does nothing for website orders, and the
 * dedupe key means calling it once per line item still sends one message.
 */
export async function notifyOrderStatus(orderId: string, status: string): Promise<void> {
  const build = STATUS_MESSAGE[status];
  if (!build) return;

  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("paystack_reference, buyer_phone, channel, is_test")
      .eq("id", orderId)
      .maybeSingle();

    // Real WhatsApp orders only: a sandbox order has no customer to message.
    if (!order || order.channel !== "whatsapp" || order.is_test) return;
    const reference = order.paystack_reference;
    const waId = order.buyer_phone;
    if (!reference || !waId) return;

    await enqueueAndSend(waId, text(build(reference)), { dedupeKey: `${reference}:${status}` });
  } catch {
    // A customer notification must never be able to fail the seller's own
    // status change.
  }
}
