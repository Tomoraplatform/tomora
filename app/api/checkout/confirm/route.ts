import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { formatNaira } from "@/lib/utils";

/**
 * Marks orders paid after a successful Paystack inline transaction, then
 * notifies the store owner (and emails the buyer a confirmation).
 *
 * Note: storefront payments settle to the owner's Paystack subaccount, so funds
 * go to their bank automatically. Server-side re-verification with the owner's
 * secret key isn't done; we confirm on the client callback and record the ref.
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

  // Fetch the pending orders for this reference before marking them paid.
  const { data: pending } = await admin
    .from("orders")
    .select("id, site_id, product_id, buyer_name, buyer_email, buyer_phone, buyer_address, amount, color")
    .eq("paystack_reference", reference)
    .eq("status", "pending");

  const { error } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort notifications (only the first time, when there were pending rows).
  if (pending && pending.length) {
    try { await notify(admin, pending, reference); } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ok: true, updated: pending?.length ?? 0 });
}

async function notify(admin: ReturnType<typeof createAdminClient>, rows: any[], reference: string) {
  const siteId = rows[0].site_id;
  const buyer = {
    name: rows[0].buyer_name as string,
    email: rows[0].buyer_email as string,
    phone: rows[0].buyer_phone as string | null,
    address: rows[0].buyer_address as string | null,
  };
  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);

  const productIds = rows.map((r) => r.product_id).filter(Boolean);
  const [{ data: products }, { data: site }] = await Promise.all([
    admin.from("products").select("id, name").in("id", productIds),
    admin.from("sites").select("user_id, site_data").eq("id", siteId).maybeSingle(),
  ]);
  const nameById = new Map((products || []).map((p: any) => [p.id, p.name]));
  const storeName = (site?.site_data as any)?.businessName || "your store";

  const items = rows
    .map((r) => `<li>${nameById.get(r.product_id) || "Item"}${r.color ? ` (${r.color})` : ""} — ${formatNaira(r.amount || 0)}</li>`)
    .join("");
  const buyerLine = [buyer.name, buyer.email, buyer.phone, buyer.address].filter(Boolean).join(" · ");

  let ownerEmail: string | null = null;
  if (site?.user_id) {
    const { data: profile } = await admin.from("profiles").select("email").eq("user_id", site.user_id).maybeSingle();
    ownerEmail = (profile?.email as string) || null;
  }

  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `New order on ${storeName} — ${formatNaira(total)}`,
      html: `
        <h2>You've received a new order</h2>
        <p>A customer just placed an order on <strong>${storeName}</strong>.</p>
        <ul>${items}</ul>
        <p><strong>Total paid: ${formatNaira(total)}</strong></p>
        <p><strong>Customer:</strong> ${buyerLine}</p>
        <p>Reference: ${reference}</p>
        <p>Log in to your Tomora dashboard to fulfil it.</p>`,
    });
  }

  if (buyer.email) {
    await sendEmail({
      to: buyer.email,
      subject: `Your order from ${storeName} is confirmed`,
      html: `
        <h2>Thank you, ${buyer.name || "there"}!</h2>
        <p>Your order from <strong>${storeName}</strong> has been placed successfully.</p>
        <ul>${items}</ul>
        <p><strong>Total: ${formatNaira(total)}</strong></p>
        <p>Reference: ${reference}</p>`,
    });
  }
}
