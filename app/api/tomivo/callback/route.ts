import { NextResponse, type NextRequest } from "next/server";
import { settleTomivoPayment } from "@/lib/tomivo/subscribe";

export const dynamic = "force-dynamic";

/** Paystack redirects subscribers here after paying. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") || request.nextUrl.searchParams.get("trxref") || "";
  const result = await settleTomivoPayment(reference);
  const dest = new URL("/tomora-ai/designs", request.nextUrl.origin);
  dest.searchParams.set("sub", result.ok ? "active" : "pending");
  return NextResponse.redirect(dest);
}
