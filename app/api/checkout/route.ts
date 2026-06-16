import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, is_live, category")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || !site.is_live || site.category !== "ecommerce") {
    return NextResponse.json({ error: "Store unavailable." }, { status: 400 });
  }

  const ids = items.map((i: any) => i.productId);
  const { data: products } = await admin
    .from("products")
    .select("id, price, stock, is_active, name")
    .in("id", ids)
    .eq("site_id", siteId);

  if (!products || !products.length) {
    return NextResponse.json({ error: "Products not found." }, { status: 400 });
  }

  const reference = `tom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let total = 0;
  const rows: any[] = [];

  for (const item of items) {
    const p = products.find((x) => x.id === item.productId);
    const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));
    if (!p || !p.is_active) continue;
    const lineTotal = p.price * qty;
    total += lineTotal;
    rows.push({
      site_id: siteId,
      product_id: p.id,
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      buyer_phone: buyer.phone || null,
      buyer_address: buyer.address || null,
      amount: lineTotal,
      paystack_reference: reference,
      status: "pending",
    });
  }

  if (!rows.length || total <= 0) {
    return NextResponse.json({ error: "Nothing to pay for." }, { status: 400 });
  }

  const { error } = await admin.from("orders").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reference, amount: total });
}
