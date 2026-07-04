import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { formatNaira } from "@/lib/utils";
import { validateCoupon } from "@/lib/coupons";
import { initTransaction } from "@/lib/paystack";
import { PAYSTACK_FEE_PERCENT } from "@/lib/constants";

/**
 * Records a storefront order as pending and returns the store owner's bank
 * details so the customer can pay by direct transfer. Amounts are computed
 * server-side from the database — never trusted from the client. The owner
 * confirms the order as paid from their dashboard once the transfer lands.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { siteId, buyer, items, couponCode, shippingZoneId } = body || {};
  if (!siteId || !buyer?.email || !buyer?.name || !Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 });
  }

  const method = body?.method === "paystack" ? "paystack" : "transfer";

  const { data: site } = await admin
    .from("sites")
    .select("id, is_live, category, site_data, user_id, bank_name, account_number, account_name, paystack_subaccount")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || !site.is_live || site.category !== "ecommerce") {
    return NextResponse.json({ error: "Store unavailable." }, { status: 400 });
  }
  if (method === "paystack" && !site.paystack_subaccount) {
    return NextResponse.json({ error: "Card payment isn't available on this store yet." }, { status: 400 });
  }
  if (method === "transfer" && !site.account_number) {
    return NextResponse.json({ error: "This store hasn't added a payment account yet." }, { status: 400 });
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
    return NextResponse.json({ error: "Nothing to order." }, { status: 400 });
  }

  // Apply a discount code (validated server-side against the store's coupons).
  let discount = 0;
  let appliedCode: string | null = null;
  if (couponCode) {
    const res = validateCoupon((site.site_data as any)?.coupons, String(couponCode), total);
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    if (res.discount > 0 && res.coupon) {
      discount = res.discount;
      appliedCode = res.coupon.code;
      const discountedTotal = total - discount;
      // Scale each line so the rows still sum to the discounted total.
      let running = 0;
      rows.forEach((r, i) => {
        if (i === rows.length - 1) r.amount = discountedTotal - running;
        else { r.amount = Math.round((r.amount / total) * discountedTotal); running += r.amount; }
      });
      total = discountedTotal;
    }
  }

  // Shipping fee for the chosen delivery location (validated server-side).
  let shippingFee = 0;
  let shippingName: string | null = null;
  if (shippingZoneId) {
    const zone = ((site.site_data as any)?.shippingZones || []).find((z: any) => z.id === shippingZoneId);
    if (zone) {
      shippingFee = Math.max(0, Math.round(Number(zone.fee) || 0));
      shippingName = String(zone.name || "").slice(0, 80);
      if (shippingFee > 0) {
        total += shippingFee;
        rows.push({
          site_id: siteId, product_id: null,
          buyer_name: buyer.name, buyer_email: buyer.email,
          buyer_phone: buyer.phone || null, buyer_address: buyer.address || null,
          amount: shippingFee, color: `Shipping: ${shippingName}`,
          paystack_reference: reference, status: "pending",
        });
      }
    }
  }

  const { error } = await admin.from("orders").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ---- Pay with Paystack (card / bank / USSD), settles to the owner's subaccount ----
  if (method === "paystack") {
    const feeBearer = (site.site_data as any)?.feeBearer === "customer" ? "customer" : "owner";
    // When the customer bears the fee, gross the charge up so the owner nets the order total.
    const charge = feeBearer === "customer" ? Math.round(total * (1 + PAYSTACK_FEE_PERCENT / 100)) : total;
    try {
      const origin = request.headers.get("origin") || new URL(request.url).origin;
      // Funds are collected into the platform balance and credited to the
      // owner's Tomora Wallet on confirmation; they withdraw to their bank.
      const init = await initTransaction({
        email: String(buyer.email),
        amountNaira: charge,
        reference,
        callbackUrl: `${origin}/?order=1`,
        metadata: { custom_fields: [{ display_name: "Order", variable_name: "order", value: buyer.name || buyer.email }] },
      });
      return NextResponse.json({ ok: true, method: "paystack", reference, amount: total, charge, feeBearer, discount, couponCode: appliedCode, accessCode: init.access_code });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Could not start the payment." }, { status: 502 });
    }
  }

  // ---- Pay by direct bank transfer to the owner ----
  const bank = { name: site.bank_name as string | null, account: site.account_number as string, holder: site.account_name as string | null };
  // Best-effort notifications (transfer = order awaits confirmation).
  try { await notify(admin, siteId, site.user_id as string, buyer, rows, total, reference, bank); } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, method: "transfer", reference, amount: total, discount, couponCode: appliedCode, bank });
}

async function notify(
  admin: ReturnType<typeof createAdminClient>, siteId: string, ownerId: string,
  buyer: any, rows: any[], total: number, reference: string,
  bank: { name: string | null; account: string; holder: string | null },
) {
  const productIds = rows.map((r) => r.product_id).filter(Boolean);
  const [{ data: dbProducts }, { data: site }, { data: profile }] = await Promise.all([
    productIds.length ? admin.from("products").select("id, name").in("id", productIds) : Promise.resolve({ data: [] as any[] }),
    admin.from("sites").select("site_data").eq("id", siteId).maybeSingle(),
    admin.from("profiles").select("email").eq("user_id", ownerId).maybeSingle(),
  ]);
  const nameById = new Map((dbProducts || []).map((p: any) => [p.id, p.name]));
  const storeName = (site?.site_data as any)?.businessName || "your store";
  const items = rows.map((r) => `<li>${nameById.get(r.product_id) || "Item"}${r.color ? ` (${r.color})` : ""} — ${formatNaira(r.amount || 0)}</li>`).join("");
  const buyerLine = [buyer.name, buyer.email, buyer.phone, buyer.address].filter(Boolean).join(" · ");
  const bankLine = `${bank.holder || ""} — ${bank.account}${bank.name ? ` (${bank.name})` : ""}`;

  // Prefer the profile email, fall back to the account's login email.
  let ownerEmail = (profile?.email as string) || null;
  if (!ownerEmail) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(ownerId);
      ownerEmail = authUser?.user?.email || null;
    } catch { /* ignore */ }
  }
  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `New order on ${storeName} — ${formatNaira(total)} (awaiting transfer)`,
      html: `<h2>New order — confirm the bank transfer</h2>
        <p>A customer placed an order on <strong>${storeName}</strong> and was asked to transfer to your account.</p>
        <ul>${items}</ul>
        <p><strong>Total: ${formatNaira(total)}</strong></p>
        <p><strong>Customer:</strong> ${buyerLine}</p>
        <p>Reference: ${reference}</p>
        <p>When the money lands in your account, open your Tomora dashboard → Orders and mark it <strong>Paid</strong>.</p>`,
    });
  }
  if (buyer.email) {
    await sendEmail({
      to: buyer.email,
      subject: `Your order from ${storeName} — complete your transfer`,
      html: `<h2>Thank you, ${buyer.name || "there"}!</h2>
        <p>To complete your order from <strong>${storeName}</strong>, please transfer <strong>${formatNaira(total)}</strong> to:</p>
        <p style="font-size:16px"><strong>${bankLine}</strong></p>
        <ul>${items}</ul>
        <p>Use reference <strong>${reference}</strong>. The seller will confirm your payment and process your order.</p>`,
    });
  }
}
