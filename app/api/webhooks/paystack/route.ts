import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { applyPlatformPayment, applyPaymentFailure, disableSubscription } from "@/lib/billing";

/**
 * Paystack webhook. Verifies the x-paystack-signature (HMAC SHA512 of the raw
 * body using the secret key), then handles platform billing events.
 *
 * Events handled:
 *  - charge.success            -> record payment, advance billing cycle
 *  - charge.failed / invoice.payment_failed -> mark past_due, grace period
 *  - subscription.disable      -> cancel + take site offline
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "";

  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
  if (!signature || signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = event?.data || {};
  const userId = data?.metadata?.userId;
  const purpose = data?.metadata?.purpose;

  try {
    switch (event.event) {
      case "charge.success":
        if (purpose === "platform" && userId && data.reference) {
          await applyPlatformPayment(userId, data.reference);
        }
        break;
      case "charge.failed":
      case "invoice.payment_failed":
        if (userId) await applyPaymentFailure(userId);
        break;
      case "subscription.disable":
        if (userId) await disableSubscription(userId);
        break;
      default:
        break;
    }
  } catch {
    // Acknowledge so Paystack does not retry-storm; log server-side in production.
    return NextResponse.json({ received: true, handled: false });
  }

  return NextResponse.json({ received: true });
}
