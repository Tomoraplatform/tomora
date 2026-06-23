import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Marks a donation paid after a successful Paystack popup. */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const reference = body?.reference;
  if (!reference) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  const { error } = await admin
    .from("donations")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .eq("status", "pending");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
