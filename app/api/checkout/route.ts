import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction } from "@/lib/paystack";

/**
 * Creates pending order rows for a storefront checkout. Amounts are computed
 * server-side from the database — never trusted from the client. Returns a
 * shared Paystack reference and the total to charge (in Naira).
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { siteId, buyer, items } = body || {};
  if (!siteId || !buyer?.email || !buyer?.name || !Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 });
  }

  const { data: site } = await admin
    .from("sites")
    .select("id, is_live, category, site_data, paystack_subaccount")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || !site.is_live || site.category !== "ecommerce") {
    return NextResponse.json({ error: "Store unavailable." }, { status: 400 });
  }

  // Real DB products.
  const realIds = items.map((i: any) => i.productId).filter((id: string) => id && !String(id).startsWith("custom:"));
  const { data: products } = realIds.length
    ? await admin.from("products").select("id, price, stock, is_active, name, is_offer, offer_percent").in("id", realIds).eq("site_id", siteId)
    : { data: [] as any[] };

  // Custom-section products: price is trusted from the site's saved data, never the client.
  const customPrices = new Map<string, number>();
  const sections = (site.site_data as any)?.customSections || [];
  for (const sec of sections) {
    if (sec?.type === "products" && Array.isArray(sec.products)) {
      for (const p of sec.products) {
        const amt = Number(String(p.price ?? "").replace(/[^0-9.]/g, "")) || 0;
        customPrices.set(`custom:${sec.id}:${p.id}`, Math.round(amt));
      }
    }
  }

  const reference = `tom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let total = 0;
  const rows: any[] = [];

  for (const item of items) {
    const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));
    const id = String(item.productId);
    let price: number | null = null;
    let productId: string | null = null;

    if (id.startsWith("custom:")) {
      const amt = customPrices.get(id);
      if (amt && amt > 0) price = amt; // product_id stays null for custom items
    } else {
      const p = (products || []).find((x: any) => x.id === item.productId);
      if (p && p.is_active) {
        // Apply the offer discount server-side so the charged price is trusted.
        price = p.is_offer && p.offer_percent > 0 ? Math.round(p.price * (1 - p.offer_percent / 100)) : p.price;
        productId = p.id;
      }
    }
    if (price == null || price <= 0) continue;

    const lineTotal = price * qty;
    total += lineTotal;
    rows.push({
      site_id: siteId,
      product_id: productId,
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      buyer_phone: buyer.phone || null,
      buyer_address: buyer.address || null,
      amount: lineTotal,
      color: item.color ? String(item.color).slice(0, 60) : null,
      paystack_reference: reference,
      status: "pending",
    });
  }

  if (!rows.length || total <= 0) {
    return NextResponse.json({ error: "Nothing to pay for." }, { status: 400 });
  }

  const { error } = await admin.from("orders").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Initialize the transaction server-side with the platform secret key — the
  // same integration that created the subaccount. This avoids the inline popup's
  // "Invalid subaccount" error that happens when the public key can't validate a
  // subaccount created by the secret key. The popup just resumes the access code.
  try {
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const init = await initTransaction({
      email: buyer.email,
      amountNaira: total,
      reference,
      callbackUrl: `${origin}/?paid=1`,
      subaccount: site.paystack_subaccount || undefined,
      metadata: { custom_fields: [{ display_name: "Buyer", variable_name: "buyer", value: buyer.name }] },
    });
    return NextResponse.json({ reference: init.reference, amount: total, accessCode: init.access_code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not start this transaction." }, { status: 502 });
  }
}
