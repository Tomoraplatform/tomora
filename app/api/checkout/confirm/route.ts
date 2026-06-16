import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Marks orders paid after a successful Paystack inline transaction.
 *
 * Note: storefront payments use the OWNER's Paystack public key, so funds
 * settle directly into the owner's Paystack account (and onward to their
 * bank). Server-side verification would require the owner's secret key; until
 * that is provided in payout settings, we confirm on the client callback and
 * record the reference for reconciliation.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const reference = body?.reference;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id")
    .eq("paystack_reference", reference)
    .eq("status", "pending");

  const { error } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, updated: orders?.length ?? 0 });
}
