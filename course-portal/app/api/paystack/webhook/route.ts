import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrollPaidStudent } from "@/lib/enrollment";
import { fromMinorUnits } from "@/lib/utils";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Raw body is required to validate the signature.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";

  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const reference: string | undefined = event?.data?.reference;

  // Log every event we receive.
  await supabase.from("webhook_events").insert({
    provider: "paystack",
    event_type: event?.event ?? "unknown",
    reference: reference ?? null,
    raw_payload: event,
    processed: false,
  });

  // Only act on successful charges.
  if (event?.event !== "charge.success" || event?.data?.status !== "success") {
    return NextResponse.json({ received: true });
  }

  // Dedupe: if a webhook for this reference was already processed, skip.
  if (reference) {
    const { count } = await supabase
      .from("webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("reference", reference)
      .eq("processed", true);
    if ((count ?? 0) > 0) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  try {
    const d = event.data;
    await enrollPaidStudent({
      email: d.customer?.email,
      fullName:
        d.metadata?.full_name || d.customer?.first_name || d.customer?.email,
      reference: d.reference,
      provider: "paystack",
      customerCode: d.customer?.customer_code,
      amount: fromMinorUnits(d.amount),
      currency: d.currency,
      rawResponse: d,
    });

    if (reference) {
      await supabase
        .from("webhook_events")
        .update({ processed: true })
        .eq("reference", reference)
        .eq("processed", false);
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (err) {
    console.error("[webhook] processing error", err);
    // Return 200 so Paystack doesn't hammer retries forever; we've logged it.
    return NextResponse.json({ received: true, error: true });
  }
}
