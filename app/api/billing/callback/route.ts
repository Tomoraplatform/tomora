import { NextResponse, type NextRequest } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { applyPlatformPayment, applyDomainPurchase, applyNewDomainRequest } from "@/lib/billing";

/** Paystack redirects here after the platform checkout completes. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const origin = request.nextUrl.origin;
  const dashboard = `${origin}/dashboard/billing`;

  if (!reference) {
    return NextResponse.redirect(`${dashboard}?status=failed`);
  }

  try {
    const result = await verifyTransaction(reference);
    const meta = result.metadata || {};
    if (result.success && meta.userId) {
      if (meta.purpose === "domain" && meta.siteId) {
        await applyDomainPurchase(meta.userId, meta.siteId);
        return NextResponse.redirect(`${origin}/dashboard/domain?status=domain`);
      }
      if (meta.purpose === "new_domain" && meta.siteId && meta.domain) {
        await applyNewDomainRequest(meta.userId, meta.siteId, meta.domain, reference);
        return NextResponse.redirect(`${origin}/dashboard/domain?status=requested`);
      }
      await applyPlatformPayment(meta.userId, reference, meta.plan);
      return NextResponse.redirect(`${dashboard}?status=success`);
    }
  } catch {
    // fall through
  }
  return NextResponse.redirect(`${dashboard}?status=failed`);
}
