import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction } from "@/lib/paystack";
import { APP_DOMAIN } from "@/lib/constants";
import { LIVE_COMMISSION_PERCENT } from "./config";
import type { LiveData, LiveProduct, LiveStore, TrackedOrder } from "./router";

/**
 * Everything Tomora Live reads and writes, against the tables that already
 * exist.
 *
 * A WhatsApp order is not a new kind of order: it writes the same one-row-per
 * -line-item shape a website order does, against the same site, so it lands in
 * the seller's existing Orders page with nothing added there. The only new
 * column is `channel`, which is how the 3% is applied to Live sales and not to
 * website sales.
 */

/** WhatsApp order references. Distinct from `tom_` so settlement can tell them apart. */
export const LIVE_REFERENCE_PREFIX = "tomwa_";

function priceOf(p: { price: number; is_offer?: boolean | null; offer_percent?: number | null }): number {
  const off = p.is_offer && (p.offer_percent || 0) > 0 ? p.offer_percent! : 0;
  return off > 0 ? Math.round(p.price * (1 - off / 100)) : p.price;
}

function toProduct(row: any): LiveProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: priceOf(row),
    stock: row.stock ?? 0,
    category: row.category,
  };
}

const PRODUCT_COLUMNS = "id, name, description, price, stock, category, is_active, is_offer, offer_percent";

async function storeFromAccount(account: any): Promise<LiveStore | null> {
  if (!account) return null;
  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites").select("id, site_data, is_live").eq("id", account.site_id).maybeSingle();
  if (!site) return null;
  return {
    siteId: account.site_id,
    storeCode: account.store_code,
    name: (site.site_data as any)?.businessName || "the store",
    greeting: account.greeting,
    paused: account.status !== "active",
  };
}

export const liveData: LiveData = {
  async findStoreByCode(code) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("live_accounts").select("*").eq("store_code", code.toUpperCase()).maybeSingle();
    return storeFromAccount(data);
  },

  async getStore(siteId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("live_accounts").select("*").eq("site_id", siteId).maybeSingle();
    return storeFromAccount(data);
  },

  async listCategories(siteId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products").select("category").eq("site_id", siteId).eq("is_active", true);
    const seen = new Set<string>();
    for (const r of (data as { category: string | null }[] | null) || []) {
      const c = (r.category || "").trim();
      if (c) seen.add(c);
    }
    return Array.from(seen).sort();
  },

  async listProducts(siteId, { category, offset, limit }) {
    const admin = createAdminClient();
    let q = admin
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("site_id", siteId)
      .eq("is_active", true);
    if (category) q = q.eq("category", category);
    const { data } = await q
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    return ((data as any[]) || []).map(toProduct);
  },

  async getProduct(siteId, productId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products").select(PRODUCT_COLUMNS)
      .eq("site_id", siteId).eq("id", productId).eq("is_active", true).maybeSingle();
    return data ? toProduct(data) : null;
  },

  async startCheckout({ siteId, waId, buyerName, address, cart }) {
    const admin = createAdminClient();

    // Prices come from the product rows, never from the cart the conversation
    // was carrying: the cart is only ever a display of what was quoted.
    const ids = cart.map((c) => c.productId);
    const { data: site } = await admin
      .from("sites").select("paystack_subaccount").eq("id", siteId).maybeSingle();
    const { data: products } = await admin
      .from("products").select(PRODUCT_COLUMNS).eq("site_id", siteId).in("id", ids);
    const byId = new Map(((products as any[]) || []).map((p) => [p.id, p]));

    const reference = `${LIVE_REFERENCE_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // WhatsApp customers have a phone, rarely an email, and orders.buyer_email
    // is NOT NULL, so a routable placeholder stands in exactly as the website's
    // guest checkout already does.
    const buyerEmail = `wa+${reference}@${APP_DOMAIN}`;

    let total = 0;
    const rows: Record<string, unknown>[] = [];
    for (const line of cart) {
      const p = byId.get(line.productId);
      if (!p || !p.is_active) continue;
      const qty = Math.max(1, Math.min(99, Math.round(line.qty)));
      const amount = priceOf(p) * qty;
      if (amount <= 0) continue;
      total += amount;
      rows.push({
        site_id: siteId,
        product_id: p.id,
        buyer_name: buyerName.slice(0, 80),
        buyer_email: buyerEmail,
        buyer_phone: waId,
        buyer_address: address.slice(0, 200) || null,
        amount,
        color: qty > 1 ? `×${qty}` : null,
        paystack_reference: reference,
        status: "pending",
        channel: "whatsapp",
        // A WhatsApp order is always a real sale: the sandbox has no customers.
        is_test: false,
        // Split to the seller's own bank, like every other Tomora payment.
        settled_direct: !!site?.paystack_subaccount,
      });
    }

    if (!rows.length || total <= 0) {
      return { ok: false, error: "Nothing in your cart is available to order any more." };
    }

    let { error } = await admin.from("orders").insert(rows);
    if (error) {
      // Database without migration 0044: drop the flag rather than lose a sale.
      ({ error } = await admin.from("orders").insert(
        rows.map(({ settled_direct: _drop, ...rest }) => rest)
      ));
    }
    if (error) return { ok: false, error: "We couldn't create your order. Please try again." };

    try {
      const init = await initTransaction({
        email: buyerEmail,
        amountNaira: total,
        reference,
        callbackUrl: `https://${APP_DOMAIN}/live/paid`,
        metadata: { purpose: "live_order", siteId, waId },
        // The seller's money goes to the seller's bank. Live's commission is
        // taken by Paystack at the same moment, as a flat cut of this
        // transaction, rather than by holding their takings first.
        ...(site?.paystack_subaccount
          ? {
              subaccount: site.paystack_subaccount as string,
              bearer: "subaccount" as const,
              transactionCharge: Math.round((total * LIVE_COMMISSION_PERCENT) / 100),
            }
          : {}),
      });
      return { ok: true, reference, payUrl: init.authorization_url, total };
    } catch {
      return { ok: false, error: "We couldn't start the payment. Please try again in a moment." };
    }
  },

  async recentOrders(siteId, waId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("orders")
      .select("paystack_reference, status, amount, created_at")
      .eq("site_id", siteId)
      .eq("buyer_phone", waId)
      // Real orders only. A customer tracking their delivery must never be
      // shown a sandbox order, and Live never creates one.
      .eq("is_test", false)
      .order("created_at", { ascending: false })
      .limit(30);

    // Orders are one row per line item, so they are grouped back up by reference.
    const grouped = new Map<string, TrackedOrder>();
    for (const r of ((data as any[]) || [])) {
      const ref = r.paystack_reference;
      if (!ref) continue;
      const existing = grouped.get(ref);
      if (existing) {
        existing.total += r.amount || 0;
      } else {
        grouped.set(ref, {
          reference: ref,
          status: r.status,
          total: r.amount || 0,
          placedAt: new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
        });
      }
    }
    return Array.from(grouped.values()).slice(0, 5);
  },
};
