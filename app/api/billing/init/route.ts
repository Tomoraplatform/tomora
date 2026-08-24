import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initTransaction } from "@/lib/paystack";
import { NEW_DOMAIN_AMOUNT, NEW_DOMAIN_TLDS, withVat } from "@/lib/constants";
import { planChargeAmount } from "@/lib/plan-pricing";
import { validatePlanCoupon } from "@/lib/plan-coupons";
import { applyPlatformPayment } from "@/lib/billing";

/** Starts a Paystack checkout for a platform plan, Pro renewal, or a domain. */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* no body, treated as a Pro renewal below */
  }

  // ---- Buy + activate a brand-new domain (assisted, ₦5,000) ----
  if (body?.purpose === "new_domain" && body?.siteId && body?.domain) {
    const domain = String(body.domain).trim().toLowerCase();
    const okTld = NEW_DOMAIN_TLDS.some((t) => domain.endsWith(`.${t}`));
    if (!okTld || !/^[a-z0-9-]+\.[a-z.]+$/.test(domain)) {
      return NextResponse.json({ error: "That domain isn't available for purchase here." }, { status: 400 });
    }
    const { data: site } = await supabase
      .from("sites").select("id").eq("id", body.siteId).eq("user_id", user.id).maybeSingle();
    if (!site) return NextResponse.json({ error: "Site not found." }, { status: 400 });
    const reference = `tomnew_${user.id.slice(0, 8)}_${Date.now()}`;
    try {
      const data = await initTransaction({
        email: user.email,
        amountNaira: withVat(NEW_DOMAIN_AMOUNT), // includes 7.5% VAT
        reference,
        callbackUrl: `${request.nextUrl.origin}/api/billing/callback`,
        metadata: { userId: user.id, purpose: "new_domain", siteId: body.siteId, domain },
      });
      return NextResponse.json({ authorization_url: data.authorization_url });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Could not start payment." }, { status: 500 });
    }
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("billing_cycle_position, plan")
    .eq("user_id", user.id)
    .maybeSingle();

  // Determine plan + amount. Shared with the coupon check so a quote and a
  // charge can never disagree.
  const planId: string = body?.plan || sub?.plan || "pro";
  const priced = await planChargeAmount(user.id, planId);
  if (priced == null) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  let amount = priced;

  // A coupon stacks on top of the public discount. Re-checked here rather than
  // trusted from the browser: this is the number the customer is charged.
  let coupon: { id: string; code: string; percent: number; discount: number } | undefined;
  if (body?.coupon) {
    const check = await validatePlanCoupon(String(body.coupon), planId, amount, user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    coupon = { id: check.couponId!, code: check.code!, percent: check.percent!, discount: check.discount! };
    amount = check.finalAmount!;
  }

  // Add 7.5% VAT on top of the (possibly discounted) plan price.
  amount = withVat(amount);

  const reference = `tomplat_${user.id.slice(0, 8)}_${Date.now()}`;
  const couponMeta = coupon
    ? { couponId: coupon.id, couponCode: coupon.code, couponPercent: coupon.percent, couponDiscount: coupon.discount }
    : {};

  // A coupon can take the price to nothing. Paystack has no ₦0 charge, so the
  // subscription is activated here instead of through a checkout the customer
  // could never complete.
  if (amount <= 0) {
    await applyPlatformPayment(user.id, reference, planId, { grossAmount: 0, coupon: couponMeta });
    return NextResponse.json({ settled: true, redirect: "/dashboard/billing?status=success" });
  }

  try {
    const data = await initTransaction({
      email: user.email,
      amountNaira: amount,
      reference,
      callbackUrl: `${request.nextUrl.origin}/api/billing/callback`,
      metadata: { userId: user.id, purpose: "platform", plan: planId, ...couponMeta },
    });
    return NextResponse.json({ authorization_url: data.authorization_url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not start payment." }, { status: 500 });
  }
}
