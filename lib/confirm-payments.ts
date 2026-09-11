import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordTransaction, creditPlatform } from "@/lib/creator/money";
import { LIVE_COMMISSION_PERCENT } from "@/lib/live/config";
import { enqueueAndSend, clearCartAfterPayment } from "@/lib/live/conversations";
import { text } from "@/lib/live/messages";
import { verifyTransaction } from "@/lib/paystack";
import { settlePaymentCharge, type PaymentCharge } from "@/lib/payment-charges";
import { sendEmail } from "@/lib/email";
import { escapeHtml as esc } from "@/lib/html";
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
 * Where to tell the owner about a sale or a gift.
 *
 * The address on the profile is the one to use: an owner can change it, and it
 * is what they expect to hear on. But a profile row can carry no email at all,
 * from an account created before the signup trigger existed or one whose
 * profile was written some other way, and the only symptom of that is silence
 * on every order they ever take. So fall back to the address the account
 * itself was registered with, which always exists.
 */
async function ownerEmailFor(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<string | null> {
  const { data: profile } = await admin
    .from("profiles").select("email").eq("user_id", userId).maybeSingle();
  const fromProfile = ((profile?.email as string) || "").trim();
  if (fromProfile) return fromProfile;

  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const fromAuth = (data?.user?.email || "").trim();
    if (fromAuth) {
      console.warn(`[notify] profile ${userId} has no email; using the account address instead`);
      return fromAuth;
    }
  } catch (err) {
    console.error("[notify] could not read the account address:", err);
  }
  return null;
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

  // Tomora's transaction fee, when this gift carried one. It went to Tomora's
  // account at Paystack, never to the organisation, so the gift recorded below
  // stays exactly what the donor chose to give.
  let charge: PaymentCharge | null = null;
  try { charge = await settlePaymentCharge(reference); } catch { /* non-fatal */ }
  const fee = charge?.platform_fee || 0;

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
        kind: "donation", reference, grossAmount: row.amount + fee,
        payeeAmount: row.amount, platformAmount: fee || undefined,
        userId: site.user_id, siteId: row.site_id,
        description: `Donation${row.donor_name ? ` from ${row.donor_name}` : ""}`,
      });
    }
  } catch { /* non-fatal, wallet table may not exist yet */ }

  // Told once, on the flip from pending to paid, so the browser confirm, the
  // Paystack webhook and the reconcile pass cannot each send their own copy.
  try { await notifyDonation(admin, updated[0], reference, charge); } catch { /* non-fatal */ }

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

  // Tomora's transaction fee, when the plan charges one. The customer paid it
  // on top of the order and it went to Tomora's account at Paystack, so the
  // order rows, and the owner's income below, are untouched by it.
  let charge: PaymentCharge | null = null;
  try { charge = await settlePaymentCharge(reference); } catch { /* non-fatal */ }
  const fee = charge?.platform_fee || 0;

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
      // Tomora's transaction fee was paid on top, so it adds to the gross
      // rather than coming out of the owner's share.
      await recordTransaction({
        kind: "store_order", reference, grossAmount: total + fee,
        payeeAmount: payee, platformAmount: commission + fee || undefined,
        userId: site.user_id, siteId: pending[0].site_id,
        description: `${isLive ? "WhatsApp order" : "Order"} from ${pending[0].buyer_name || "customer"}`,
      });
    }
  } catch { /* non-fatal, wallet table may not exist yet */ }

  try { await notifyOrder(admin, pending, reference, charge); } catch { /* non-fatal */ }
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

/**
 * The customer's receipt lines when they paid more than the merchant's total.
 * Their bank statement shows what they were charged, so the receipt has to
 * add up to that, not to the order total the owner sees.
 */
function customerTotalHtml(
  labels: { plain: string; base: string }, subtotal: number, charge: PaymentCharge | null,
): string {
  const extra = charge ? charge.total_charged - charge.subtotal : 0;
  if (!charge || extra <= 0) return `<p><strong>${labels.plain}: ${formatNaira(subtotal)}</strong></p>`;
  return `
        <p>${labels.base}: ${formatNaira(charge.subtotal)}<br>
        Processing fee: ${formatNaira(extra)}<br>
        <strong>Total paid: ${formatNaira(charge.total_charged)}</strong></p>`;
}

async function notifyOrder(
  admin: ReturnType<typeof createAdminClient>, rows: any[], reference: string, charge: PaymentCharge | null = null,
) {
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

  const ownerEmail = site?.user_id ? await ownerEmailFor(admin, site.user_id) : null;

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
        ${customerTotalHtml({ plain: "Total", base: "Subtotal" }, total, charge)}
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
  charge: PaymentCharge | null = null,
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

  const ownerEmail = site?.user_id ? await ownerEmailFor(admin, site.user_id) : null;

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
        ${customerTotalHtml({ plain: "Amount", base: "Donation" }, row?.amount || 0, charge)}
        ${projectLine}
        <p>Reference: ${esc(reference)}</p>
        <p>Keep this email as your receipt.</p>`,
    });
  }
}
