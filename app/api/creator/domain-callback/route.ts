import { NextResponse, type NextRequest } from "next/server";
import { settleCreatorDomain } from "@/lib/creator/domain";

export const dynamic = "force-dynamic";

/** Paystack redirects creators here after paying for a custom domain. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") || request.nextUrl.searchParams.get("trxref") || "";
  const result = await settleCreatorDomain(reference);
  const dest = new URL("/academy/sell", request.nextUrl.origin);
  dest.searchParams.set("domain", result.ok ? "paid" : "pending");
  return NextResponse.redirect(dest);
}
