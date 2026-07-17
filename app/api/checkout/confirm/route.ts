import { NextResponse, type NextRequest } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { confirmOrdersPaid } from "@/lib/confirm-payments";

/**
 * Marks orders paid after a successful Paystack inline transaction. The charge
 * is re-verified with Paystack server-side before rows flip to paid or the
 * owner's wallet is credited; the webhook covers buyers who never return.
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const reference = body?.reference;
  if (!reference || typeof reference !== "string" || !reference.startsWith("tom_")) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  try {
    const v = await verifyTransaction(reference);
    if (!v.success) return NextResponse.json({ error: "Payment not confirmed yet." }, { status: 402 });
  } catch {
    // Paystack unreachable, don't fail the buyer's screen; the webhook settles it.
    return NextResponse.json({ ok: true, deferred: true });
  }

  try {
    const { updated } = await confirmOrdersPaid(reference);
    return NextResponse.json({ ok: true, updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
