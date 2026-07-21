import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initTransaction } from "@/lib/paystack";
import { getPlan, nextCharge, NEW_DOMAIN_AMOUNT, NEW_DOMAIN_TLDS, withVat } from "@/lib/constants";
import { loadPlanDiscounts, discountedPrice } from "@/lib/discounts";

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

  // Determine plan + amount.
  const planId: string = body?.plan || sub?.plan || "pro";
  const plan = getPlan(planId);
  if (!plan || plan.price == null) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  let amount = plan.price;
  // Pro uses the 3-month cycle; a renewal (already on Pro) uses nextCharge.
  if (planId === "pro" && sub?.plan === "pro") {
    amount = nextCharge(sub.billing_cycle_position ?? 0).amount;
  }
  // One-time plan: ₦84,500 for the first year, then the yearly renewal price.
  if (planId === "onetime" && sub?.plan === "onetime") {
    amount = plan.renewal ?? plan.price;
  }

  // Apply any active admin discount for this plan.
  const discounts = await loadPlanDiscounts();
  amount = discountedPrice(amount, discounts[planId]);
  // Add 7.5% VAT on top of the (possibly discounted) plan price.
  amount = withVat(amount);

  const reference = `tomplat_${user.id.slice(0, 8)}_${Date.now()}`;

  try {
    const data = await initTransaction({
      email: user.email,
      amountNaira: amount,
      reference,
      callbackUrl: `${request.nextUrl.origin}/api/billing/callback`,
      metadata: { userId: user.id, purpose: "platform", plan: planId },
    });
    return NextResponse.json({ authorization_url: data.authorization_url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not start payment." }, { status: 500 });
  }
}
