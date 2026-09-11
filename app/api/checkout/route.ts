import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { formatNaira } from "@/lib/utils";
import { validateCoupon } from "@/lib/coupons";
import { initTransaction } from "@/lib/paystack";
import { PAYSTACK_FEE_PERCENT } from "@/lib/constants";
import { combosOf } from "@/lib/restaurant/types";
import { feePolicyForOwner, type FeePolicy } from "@/lib/plan-fees";
import { quoteCharge } from "@/lib/platform-fee";
import { recordPaymentCharge } from "@/lib/payment-charges";

/**
 * Records a storefront order as pending and returns the store owner's bank
 * details so the customer can pay by direct transfer. Amounts are computed
 * server-side from the database, never trusted from the client. The owner
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

  const { siteId, buyer, items, couponCode, shippingZoneId, fulfilment } = body || {};
  // Restaurants let the customer collect in person, which skips the zone fee.
  const isPickup = fulfilment === "pickup";
  // Email is optional: plenty of customers here order with a phone number and
  // nothing else, and a required address field only loses the sale.
  if (!siteId || !buyer?.name || !Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 });
  }
  const buyerEmail = String(buyer.email || "").trim();

  const method = body?.method === "paystack" ? "paystack" : "transfer";

  const { data: site } = await admin
    .from("sites")
    .select("id, is_live, category, site_data, user_id, bank_name, account_number, account_name, paystack_subaccount, is_demo")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || !site.is_live || site.category !== "ecommerce") {
    return NextResponse.json({ error: "Store unavailable." }, { status: 400 });
  }
  const isDemo = !!site.is_demo;
  if (!isDemo && method === "paystack" && !site.paystack_subaccount) {
    return NextResponse.json({ error: "Card payment isn't available on this store yet." }, { status: 400 });
  }
  if (!isDemo && method === "transfer" && !site.account_number) {
    return NextResponse.json({ error: "This store hasn't added a payment account yet." }, { status: 400 });
  }

  // The owner's plan decides Tomora's transaction fee, and whether the store
  // may take a bank transfer at all: a transfer never touches Paystack, so a
  // fee could not be split from it. The sandbox moves no money and pays none.
  let policy: FeePolicy | null = null;
  if (!isDemo) {
    try {
      policy = await feePolicyForOwner(site.user_id as string);
    } catch (e) {
      console.error("[checkout] could not resolve the store's plan:", e);
      return NextResponse.json({ error: "Checkout is briefly unavailable. Please try again in a moment." }, { status: 503 });
    }
    if (method === "transfer" && !policy.allowBankTransfer) {
      return NextResponse.json({ error: "This store takes online payment only. Please pay with card, bank or USSD." }, { status: 400 });
    }
  }

  // Real DB products.
  const realIds = items.map((i: any) => i.productId).filter((id: string) => id && !String(id).startsWith("custom:"));
  // Demo stock is buyable on its own demo storefront and nowhere else.
  const productQuery = admin
    .from("products").select("id, price, stock, is_active, name, is_offer, offer_percent")
    .in("id", realIds).eq("site_id", siteId);
  const { data: products } = realIds.length
    ? await (isDemo ? productQuery : productQuery.eq("is_test_only", false))
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

  // Restaurant combos: a fixed-price bundle. Priced from the saved settings,
  // never from the request, exactly like the custom-section products above.
  const comboPrices = new Map<string, { price: number; name: string }>();
  for (const c of combosOf(site.site_data as any) as any[]) {
    if (!c?.id || c.available === false) continue;
    const amt = Math.round(Number(c.price) || 0);
    if (amt > 0) comboPrices.set(`combo:${c.id}`, { price: amt, name: String(c.name || "Combo") });
  }

  const reference = `${isDemo ? "sbx" : "tom"}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // A card payment splits at Paystack straight to the owner's payout account,
  // so Tomora never holds it and the wallet must not offer it for withdrawal.
  // A bank transfer goes to them directly too, but Tomora is not in that path
  // at all. Only the sandbox keeps the old wallet behaviour, against fake money.
  const settlesDirect = !isDemo && method === "paystack";
  let total = 0;
  const rows: any[] = [];

  for (const item of items) {
    const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));
    const id = String(item.productId);
    let price: number | null = null;
    let productId: string | null = null;

    let label: string | null = null;
    if (id.startsWith("combo:")) {
      const combo = comboPrices.get(id);
      if (combo) {
        price = combo.price; // product_id stays null for combos
        label = combo.name; // so the order row is not blank in the dashboard
      }
    } else if (id.startsWith("custom:")) {
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
      buyer_email: buyerEmail,
      buyer_phone: buyer.phone || null,
      buyer_address: isPickup ? "Pickup in person" : buyer.address || null,
      amount: lineTotal,
      color: String(item.color || label || "").slice(0, 60) || null,
      paystack_reference: reference,
      status: isDemo ? "paid" : "pending",
      is_test: isDemo,
      settled_direct: settlesDirect,
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
  if (shippingZoneId && !isPickup) {
    const zone = ((site.site_data as any)?.shippingZones || []).find((z: any) => z.id === shippingZoneId);
    if (zone) {
      shippingFee = Math.max(0, Math.round(Number(zone.fee) || 0));
      shippingName = String(zone.name || "").slice(0, 80);
      if (shippingFee > 0) {
        total += shippingFee;
        rows.push({
          site_id: siteId, product_id: null,
          buyer_name: buyer.name, buyer_email: buyerEmail,
          buyer_phone: buyer.phone || null, buyer_address: buyer.address || null,
          amount: shippingFee, color: `Delivery: ${shippingName}`,
          paystack_reference: reference,
          status: isDemo ? "paid" : "pending", is_test: isDemo,
          settled_direct: settlesDirect,
        });
      }
    }
  }

  let { error } = await admin.from("orders").insert(rows);
  if (error) {
    // Database without migration 0044: drop the flag rather than lose the sale.
    ({ error } = await admin.from("orders").insert(
      rows.map(({ settled_direct: _drop, ...rest }) => rest)
    ));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ---- Demo store: settle it here and stop ----
  // No processor is called and no one is emailed. The money is recorded against
  // the sandbox so it shows in test mode's orders, revenue and stats.
  if (isDemo) {
    await Promise.all([
      admin.from("wallet_transactions").insert({
        user_id: site.user_id, site_id: siteId, type: "income", source: "order",
        amount: total, status: "completed", reference,
        description: `Sandbox order from ${buyer.name}`, is_test: true,
      }),
      admin.from("transactions").insert({
        kind: "store_order", reference, gross_amount: total, platform_amount: 0,
        payee_amount: total, vat_amount: 0, user_id: site.user_id, site_id: siteId,
        description: `Sandbox order from ${buyer.name}`, is_test: true,
      }),
    ]);
    return NextResponse.json({
      ok: true, method: "transfer", sandbox: true, reference, amount: total,
      discount, couponCode: appliedCode,
      bank: { name: "Sandbox", account: "0000000000", holder: "Test payment, no money moved" },
    });
  }

  // ---- Pay with Paystack (card / bank / USSD), settles to the owner's subaccount ----
  if (method === "paystack") {
    const feeBearer = (site.site_data as any)?.feeBearer === "customer" ? "customer" : "owner";
    // `total` is what the owner is owed. Tomora's fee goes on top of it, and
    // when the customer bears Paystack's fee the whole charge is grossed up so
    // the owner still nets the order total.
    const quote = quoteCharge(total, policy?.rate, feeBearer === "customer" ? PAYSTACK_FEE_PERCENT : 0);
    const charge = quote.totalCharged;
    try {
      const origin = request.headers.get("origin") || new URL(request.url).origin;
      if (policy) {
        await recordPaymentCharge({
          reference, kind: "order", siteId, ownerId: site.user_id as string, policy, quote,
        });
      }
      // Split to the owner's own payout account, so the sale lands in their
      // bank rather than Tomora's balance. They bear Paystack's fee. Tomora's
      // fee, when the plan has one, is sent as transaction_charge: Paystack
      // pays it to Tomora's main account and it overrides the subaccount's
      // own percentage (0%) for this payment only.
      const init = await initTransaction({
        // Paystack requires one; the order itself keeps whatever the buyer gave.
        email: buyerEmail || `guest+${reference}@tomora.com.ng`,
        amountNaira: charge,
        reference,
        callbackUrl: `${origin}/?order=1`,
        subaccount: site.paystack_subaccount as string,
        bearer: "subaccount",
        transactionCharge: quote.platformFee > 0 ? quote.platformFee : undefined,
        metadata: { custom_fields: [{ display_name: "Order", variable_name: "order", value: buyer.name || buyer.email }] },
      });
      return NextResponse.json({
        ok: true, method: "paystack", reference, amount: total, subtotal: total,
        platformFee: quote.platformFee, processingFee: charge - total, charge, feeBearer,
        discount, couponCode: appliedCode, accessCode: init.access_code,
      });
    } catch (e: any) {
      // Paystack refusing the store's payout account is the owner's setup, not
      // something a shopper can act on, and its wording ("Invalid Subaccount")
      // means nothing to them. Say what they can do, and log it for the admin
      // Payments health page to explain.
      if (/subaccount/i.test(String(e?.message))) {
        console.error(`[checkout] Paystack rejected the payout account of site ${siteId}: ${e.message}`);
        const canTransfer = !!site.account_number && (policy?.allowBankTransfer ?? true)
          && ((site.site_data as any)?.paymentMethods?.transfer ?? true);
        return NextResponse.json({
          error: canTransfer
            ? "Card payment isn't available on this store right now. Please choose bank transfer, or contact the store."
            : "Card payment isn't available on this store right now. Please contact the store.",
        }, { status: 502 });
      }
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
  const items = rows.map((r) => `<li>${nameById.get(r.product_id) || "Item"}${r.color ? ` (${r.color})` : ""}, ${formatNaira(r.amount || 0)}</li>`).join("");
  const buyerLine = [buyer.name, buyer.email, buyer.phone, buyer.address].filter(Boolean).join(" · ");
  const bankLine = `${bank.holder || ""}, ${bank.account}${bank.name ? ` (${bank.name})` : ""}`;

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
      subject: `New order on ${storeName}, ${formatNaira(total)} (awaiting transfer)`,
      html: `<h2>New order, confirm the bank transfer</h2>
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
      subject: `Your order from ${storeName}, complete your transfer`,
      html: `<h2>Thank you, ${buyer.name || "there"}!</h2>
        <p>To complete your order from <strong>${storeName}</strong>, please transfer <strong>${formatNaira(total)}</strong> to:</p>
        <p style="font-size:16px"><strong>${bankLine}</strong></p>
        <ul>${items}</ul>
        <p>Use reference <strong>${reference}</strong>. The seller will confirm your payment and process your order.</p>`,
    });
  }
}
