import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { applyPlatformPayment, applyPaymentFailure, disableSubscription, applyDomainPurchase } from "@/lib/billing";
import { confirmDonationPaid, confirmOrdersPaid } from "@/lib/confirm-payments";
import { settleAcademyPayment } from "@/lib/academy/enroll";
import { settleTomivoPayment } from "@/lib/tomivo/subscribe";
import { settleCreatorPurchase } from "@/lib/creator/purchase";
import { settleCreatorDomain } from "@/lib/creator/domain";
import { settleResourcePurchase } from "@/lib/resources/purchase";

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
        } else if (ref.startsWith("tom_") || ref.startsWith("tomwa_")) {
          // Same settlement for both: confirmOrdersPaid reads the order's
          // channel and applies Tomora Live's commission when it was a
          // WhatsApp sale.
          await confirmOrdersPaid(ref);
        } else if (ref.startsWith("acad_")) {
          // Course purchase, enroll even if the buyer never returned.
          await settleAcademyPayment(ref);
        } else if (ref.startsWith("tomdsn_")) {
          // Tomora AI Designs subscription, activate even if the buyer never returned.
          await settleTomivoPayment(ref);
        } else if (ref.startsWith("crs_")) {
          // Creator course sale: enroll + split the money to both wallets.
          await settleCreatorPurchase(ref);
        } else if (ref.startsWith("crdom_")) {
          // Creator custom domain: record the request for admin registration.
          await settleCreatorDomain(ref);
        } else if (ref.startsWith("res_")) {
          // Resource purchase: unlock it and email the buyer their link.
          await settleResourcePurchase(ref);
        } else if (purpose === "domain" && userId && data?.metadata?.siteId) {
          await applyDomainPurchase(userId, data.metadata.siteId);
        } else if (purpose === "platform" && userId && ref) {
          await applyPlatformPayment(userId, ref, data?.metadata?.plan, {
            grossAmount: typeof data?.amount === "number" ? data.amount / 100 : undefined,
            coupon: data?.metadata,
          });
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
