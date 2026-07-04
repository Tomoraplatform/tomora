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

  const { data: updated, error } = await admin
    .from("donations")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .eq("status", "pending")
    .select("site_id, amount, donor_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Credit the organisation's Tomora Wallet (first confirmation only; a unique
  // index on (type, reference) also guards against double-credits).
  if (updated && updated.length) {
    try {
      const row = updated[0] as { site_id: string; amount: number; donor_name: string | null };
      const { data: site } = await admin.from("sites").select("user_id").eq("id", row.site_id).maybeSingle();
      if (site?.user_id && row.amount > 0) {
        await admin.from("wallet_transactions").insert({
          user_id: site.user_id,
          site_id: row.site_id,
          type: "income",
          source: "donation",
          amount: row.amount,
          status: "completed",
          reference,
          description: `Donation${row.donor_name ? ` from ${row.donor_name}` : ""}`,
        });
      }
    } catch { /* non-fatal — wallet table may not exist yet */ }
  }

  return NextResponse.json({ ok: true });
}
