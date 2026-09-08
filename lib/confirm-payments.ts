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

/**
 * Escapes a value before it goes into an email body.
 *
 * Donor and buyer names are typed by strangers and land in the owner's inbox
 * as HTML, so an unescaped one could put markup in a message the owner trusts.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Marks a donation paid and credits the site owner's Tomora Wallet. */
export async function confirmDonationPaid(reference: string): Promise<{ updated: boolean }> {
  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("donations")
    .update({ status: "paid" })
    .eq("paystack_reference", reference)
    .eq("status", "pending")
    // `*` rather than naming settled_direct: the column arrives in migration
    // 0044, and asking for one that does not exist yet fails the whole query,
    // which would stop donations settling on a database that has not run it.
    .select("*");
  if (error) throw new Error(error.message);
  if (!updated || !updated.length) return { updated: false };

  try {
    const row = updated[0] as {
      site_id: string; amount: number; donor_name: string | null; settled_direct?: boolean;
    };
    // Split straight to the organisation's bank: record it so their history is
    // complete, but not as a balance, because Tomora is not holding it.
    const direct = !!row.settled_direct;
    const { data: site } = await admin.from("sites").select("user_id").eq("id", row.site_id).maybeSingle();
    if (site?.user_id && row.amount > 0) {
      await admin.from("wallet_transactions").insert({
        user_id: site.user_id,
        site_id: row.site_id,
        type: "income",
        source: "donation",
        amount: row.amount,
        status: direct ? "settled" : "completed",
        reference,
        description: `Donation${row.donor_name ? ` from ${row.donor_name}` : ""}${direct ? ", paid to your bank" : ""}`,
      });
      // Donations are the owner's money; recorded for platform-wide stats only.
      await recordTransaction({
        kind: "donation", reference, grossAmount: row.amount,
        payeeAmount: row.amount, userId: site.user_id, siteId: row.site_id,
        description: `Donation${row.donor_name ? ` from ${row.donor_name}` : ""}`,
      });
    }
  } catch { /* non-fatal, wallet table may not exist yet */ }

  // Told once, on the flip from pending to paid, so the browser confirm, the
  // Paystack webhook and the reconcile pass cannot each send their own copy.
  try { await notifyDonation(admin, updated[0], reference); } catch { /* non-fatal */ }

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
  // Card sales split at Paystack to the owner's payout account. The wallet
  // still shows the income, but crediting it as a balance would let them
  // withdraw money Tomora never received, and pay for the sale twice.
  const direct = !!(pending[0] as { settled_direct?: boolean }).settled_direct;

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
        status: direct ? "settled" : "completed",
        reference,
        description: `${isLive ? "WhatsApp order" : "Order"} from ${pending[0].buyer_name || "customer"}${direct ? ", paid to your bank" : ""}`,
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
    .map((r) => `<li>${esc(nameById.get(r.product_id) || "Item")}${r.color ? ` (${esc(r.color)})` : ""}, ${formatNaira(r.amount || 0)}</li>`)
    .join("");
  const buyerLine = esc([buyer.name, buyer.email, buyer.phone, buyer.address].filter(Boolean).join(" · "));

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
        <p>A customer just placed an order on <strong>${esc(storeName)}</strong>.</p>
        <ul>${items}</ul>
        <p><strong>Total paid: ${formatNaira(total)}</strong></p>
        <p><strong>Customer:</strong> ${buyerLine}</p>
        <p>Reference: ${esc(reference)}</p>
        <p>Log in to your Tomora dashboard to fulfil it.</p>`,
    });
  }

  if (buyer.email) {
    await sendEmail({
      to: buyer.email,
      subject: `Your order from ${storeName} is confirmed`,
      html: `
        <h2>Thank you, ${esc(buyer.name || "there")}!</h2>
        <p>Your order from <strong>${esc(storeName)}</strong> has been placed successfully.</p>
        <ul>${items}</ul>
        <p><strong>Total: ${formatNaira(total)}</strong></p>
        <p>Reference: ${esc(reference)}</p>`,
    });
  }
}

/**
 * Tells the owner a gift arrived, and thanks the donor.
 *
 * Mirrors the order notification deliberately: an organisation watching for
 * donations should not have to check a dashboard to learn one came in, and a
 * donor who gave money should get something they can keep.
 */
async function notifyDonation(
  admin: ReturnType<typeof createAdminClient>,
  row: any,
  reference: string,
) {
  const amount = formatNaira(row?.amount || 0);
  const { data: site } = await admin
    .from("sites").select("user_id, site_data").eq("id", row.site_id).maybeSingle();
  const orgName = (site?.site_data as any)?.businessName || "your site";

  // project_name arrives with migration 0026; older rows simply have none.
  const projectLine = row?.project_name
    ? `<p><strong>Project:</strong> ${esc(row.project_name)}</p>`
    : "";
  const donorLine = esc([row?.donor_name, row?.donor_email].filter(Boolean).join(" · ")) || "Anonymous";
  // Split straight to their bank rather than held in the Tomora wallet.
  const whereItWent = row?.settled_direct
    ? "It has been paid into your bank account by Paystack."
    : "It has been added to your Tomora Wallet.";

  let ownerEmail: string | null = null;
  if (site?.user_id) {
    const { data: profile } = await admin
      .from("profiles").select("email").eq("user_id", site.user_id).maybeSingle();
    ownerEmail = (profile?.email as string) || null;
  }

  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `New donation on ${orgName}, ${amount}`,
      html: `
        <h2>You've received a new donation</h2>
        <p>Someone just gave to <strong>${esc(orgName)}</strong>.</p>
        <p><strong>Amount: ${amount}</strong></p>
        ${projectLine}
        <p><strong>From:</strong> ${donorLine}</p>
        <p>${whereItWent}</p>
        <p>Reference: ${esc(reference)}</p>`,
    });
  }

  if (row?.donor_email) {
    await sendEmail({
      to: row.donor_email,
      subject: `Thank you for your donation to ${orgName}`,
      html: `
        <h2>Thank you, ${esc(row.donor_name || "friend")}!</h2>
        <p>Your donation to <strong>${esc(orgName)}</strong> has been received.</p>
        <p><strong>Amount: ${amount}</strong></p>
        ${projectLine}
        <p>Reference: ${esc(reference)}</p>
        <p>Keep this email as your receipt.</p>`,
    });
  }
}
