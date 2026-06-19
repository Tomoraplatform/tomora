import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initTransaction } from "@/lib/paystack";
import { getPlan, nextCharge } from "@/lib/constants";

/** Starts a Paystack checkout for a platform plan (or a Pro renewal). */
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
    /* no body — treated as a Pro renewal below */
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
  // Pro uses the 4-month cycle; a renewal (already on Pro) uses nextCharge.
  if (planId === "pro" && sub?.plan === "pro") {
    amount = nextCharge(sub.billing_cycle_position ?? 0).amount;
  }

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
