import { NextResponse, type NextRequest } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { applyPlatformPayment } from "@/lib/billing";

/** Paystack redirects here after the platform checkout completes. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const dashboard = `${request.nextUrl.origin}/dashboard/billing`;

  if (!reference) {
    return NextResponse.redirect(`${dashboard}?status=failed`);
  }

  try {
    const result = await verifyTransaction(reference);
    if (result.success && result.metadata?.userId) {
      await applyPlatformPayment(result.metadata.userId, reference, result.metadata.plan);
      return NextResponse.redirect(`${dashboard}?status=success`);
    }
  } catch {
    // fall through
  }
  return NextResponse.redirect(`${dashboard}?status=failed`);
}
