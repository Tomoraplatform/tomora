import { NextResponse, type NextRequest } from "next/server";
import { settleCreatorPurchase } from "@/lib/creator/purchase";

export const dynamic = "force-dynamic";

/** Paystack redirects creator-course buyers here after paying. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") || request.nextUrl.searchParams.get("trxref") || "";
  const result = await settleCreatorPurchase(reference);

  if (result.ok && result.creatorSlug && result.courseSlug) {
    return NextResponse.redirect(new URL(`/c/${result.creatorSlug}/${result.courseSlug}/learn?welcome=1`, request.nextUrl.origin));
  }
  const portal = new URL("/academy/portal", request.nextUrl.origin);
  portal.searchParams.set("status", result.ok ? "success" : "pending");
  return NextResponse.redirect(portal);
}
