import { NextResponse, type NextRequest } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { confirmDonationPaid } from "@/lib/confirm-payments";

/**
 * Marks a donation paid after the Paystack popup succeeds. The charge is
 * re-verified with Paystack server-side before anything is credited, so a
 * forged confirm call can't mark unpaid donations as paid. The webhook and
 * the dashboard reconcile pass settle donations this endpoint misses.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const reference = body?.reference;
  if (!reference || typeof reference !== "string" || !reference.startsWith("don_")) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  try {
    const v = await verifyTransaction(reference);
    if (!v.success) return NextResponse.json({ error: "Payment not confirmed yet." }, { status: 402 });
  } catch {
    // Paystack unreachable, don't fail the donor's screen; webhook/reconcile settle it.
    return NextResponse.json({ ok: true, deferred: true });
  }

  try {
    await confirmDonationPaid(reference);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
