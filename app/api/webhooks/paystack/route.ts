import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { applyPlatformPayment, applyPaymentFailure, disableSubscription, applyDomainPurchase } from "@/lib/billing";
import { confirmDonationPaid, confirmOrdersPaid } from "@/lib/confirm-payments";
import { settleAcademyPayment } from "@/lib/academy/enroll";

/**
 * Paystack webhook. Verifies the x-paystack-signature (HMAC SHA512 of the raw
 * body using the secret key), then handles platform billing events.
 *
 * Events handled:
 *  - charge.success            -> settle by reference: donations (don_*) and
 *                                 store orders (tom_*) credit the owner's
 *                                 wallet; platform/domain advance billing
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
      case "charge.success": {
        const ref: string = data?.reference || "";
        if (ref.startsWith("don_")) {
          // Donor paid, settle even if they never returned to the site.
          await confirmDonationPaid(ref);
        } else if (ref.startsWith("tom_")) {
          await confirmOrdersPaid(ref);
        } else if (ref.startsWith("acad_")) {
          // Course purchase, enroll even if the buyer never returned.
          await settleAcademyPayment(ref);
        } else if (purpose === "domain" && userId && data?.metadata?.siteId) {
          await applyDomainPurchase(userId, data.metadata.siteId);
        } else if (purpose === "platform" && userId && ref) {
          await applyPlatformPayment(userId, ref, data?.metadata?.plan);
        }
        break;
      }
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
