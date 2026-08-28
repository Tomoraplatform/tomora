import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordTransaction, creditPlatform } from "@/lib/creator/money";
import { LIVE_COMMISSION_PERCENT } from "@/lib/live/config";
import { enqueueAndSend, clearCartAfterPayment } from "@/lib/live/conversations";
import { text } from "@/lib/live/messages";
import { verifyTransaction } from "@/lib/paystack";
import { sendEmail } from "@/lib/email";
import { formatNaira } from "@/lib/utils";

/**
 * Server-side settlement for visitor payments (donations `don_*` and store
 * orders `tom_*`). Each confirm is idempotent, it only acts when pending rows
 * flip to paid, and a unique index on wallet (type, reference) guards credits.
 * Called from the browser confirm endpoints, the Paystack webhook, and the
 * dashboard reconcile pass, so a donor closing the tab after paying can no
 * longer strand money outside the owner's wallet.
 */

/** Marks a donation paid and credits the site owner's Tomora Wallet. */
export async function confirmDonationPaid(reference: string): Promise<{ updated: boolean }> {
  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("donations")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .eq("status", "pending")
    .select("site_id, amount, donor_name");
  if (error) throw new Error(error.message);
  if (!updated || !updated.length) return { updated: false };

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
      // Donations are the owner's money; recorded for platform-wide stats only.
      await recordTransaction({
        kind: "donation", reference, grossAmount: row.amount,
        payeeAmount: row.amount, userId: site.user_id, siteId: row.site_id,
        description: `Donation${row.donor_name ? ` from ${row.donor_name}` : ""}`,
      });
    }
  } catch { /* non-fatal, wallet table may not exist yet */ }

  return { updated: true };
}

/** Marks a reference's orders paid, credits the owner's wallet and notifies both sides. */
export async function confirmOrdersPaid(reference: string): Promise<{ updated: number }> {
  const admin = createAdminClient();

  // `*` rather than a column list on purpose: `channel` arrives in migration
  // 0042, and naming a column that does not exist yet would fail the query
  // outright, which would stop every store order settling on a database that
  // has not run it. With `*` the column is simply absent and this behaves
  // exactly as it did before Live existed.
  const { data: pending } = await admin
    .from("orders")
    .select("*")
    .eq("paystack_reference", reference)
    .eq("status", "pending");
  if (!pending || !pending.length) return { updated: 0 };

  const { error } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  // Tomora Live is paid for by a commission on the sales it brings in, and by
  // nothing else. It applies only to orders that came through WhatsApp, so a
  // seller's website sales are untouched.
  const isLive = (pending[0] as { channel?: string }).channel === "whatsapp";

  try {
    const total = pending.reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const commission = isLive ? Math.round((total * LIVE_COMMISSION_PERCENT) / 100) : 0;
    const payee = total - commission;
    const { data: site } = await admin
      .from("sites").select("user_id").eq("id", pending[0].site_id).maybeSingle();
    if (site?.user_id && total > 0) {
      await admin.from("wallet_transactions").insert({
        user_id: site.user_id,
        site_id: pending[0].site_id,
        type: "income",
        source: "order",
        amount: payee,
        status: "completed",
        reference,
        description: `${isLive ? "WhatsApp order" : "Order"} from ${pending[0].buyer_name || "customer"}`,
      });
      if (commission > 0) {
        await creditPlatform({
          source: "live_fee",
          amount: commission,
          reference,
          description: `Tomora Live ${LIVE_COMMISSION_PERCENT}% on ${reference}`,
        });
      }
      // Store sales belong to the owner, less Live's cut when there is one.
      await recordTransaction({
        kind: "store_order", reference, grossAmount: total,
        payeeAmount: payee, platformAmount: commission || undefined,
        userId: site.user_id, siteId: pending[0].site_id,
        description: `${isLive ? "WhatsApp order" : "Order"} from ${pending[0].buyer_name || "customer"}`,
      });
    }
  } catch { /* non-fatal, wallet table may not exist yet */ }

  try { await notifyOrder(admin, pending, reference); } catch { /* non-fatal */ }
  if (isLive) {
    try { await notifyLiveBuyer(pending, reference); } catch { /* non-fatal */ }
  }

  return { updated: pending.length };
}

/**
 * Tells the WhatsApp customer their payment landed, and empties the cart the
 * order was made from so they do not buy the same thing twice.
 */
async function notifyLiveBuyer(rows: any[], reference: string) {
  const waId = rows[0]?.buyer_phone;
  if (!waId) return;
  const total = rows.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  await clearCartAfterPayment(waId, reference);
  // Same dedupe key the status notifier uses for `paid`, so a seller who also
  // marks the order paid by hand cannot make the customer hear it twice.
  await enqueueAndSend(waId, text(
    `✅ Payment received, thank you!\n\n` +
    `Your order *${reference}* for ${formatNaira(total)} is confirmed and the seller has been notified.\n\n` +
    `Send *track* any time to check on it.`
  ), { dedupeKey: `${reference}:paid` });
}

/**
 * Settles any pending donations for a site whose Paystack charge actually
 * succeeded (donor paid but never returned to fire the browser confirm).
 * Runs when the owner opens Dashboard → Donations; bounded and best-effort.
 */
export async function reconcilePendingDonations(siteId: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 45 * 86400000).toISOString();
  const { data: rows } = await admin
    .from("donations")
    .select("paystack_reference")
    .eq("site_id", siteId)
    .eq("status", "pending")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(25);

  let settled = 0;
  for (const r of rows || []) {
    if (!r.paystack_reference) continue;
    try {
      const v = await verifyTransaction(r.paystack_reference);
      if (v.success) {
        const { updated } = await confirmDonationPaid(r.paystack_reference);
        if (updated) settled += 1;
      }
    } catch { /* skip, try again next visit */ }
  }
  return settled;
}

async function notifyOrder(admin: ReturnType<typeof createAdminClient>, rows: any[], reference: string) {
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
    .map((r) => `<li>${nameById.get(r.product_id) || "Item"}${r.color ? ` (${r.color})` : ""}, ${formatNaira(r.amount || 0)}</li>`)
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
      subject: `New order on ${storeName}, ${formatNaira(total)}`,
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
