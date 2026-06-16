import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initTransaction } from "@/lib/paystack";
import { nextCharge } from "@/lib/constants";

/** Starts a Paystack checkout for the platform Pro plan / renewal. */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("billing_cycle_position")
    .eq("user_id", user.id)
    .maybeSingle();

  const { amount } = nextCharge(sub?.billing_cycle_position ?? 0);
  const reference = `tomplat_${user.id.slice(0, 8)}_${Date.now()}`;

  try {
    const data = await initTransaction({
      email: user.email,
      amountNaira: amount,
      reference,
      callbackUrl: `${request.nextUrl.origin}/api/billing/callback`,
      metadata: { userId: user.id, purpose: "platform" },
    });
    return NextResponse.json({ authorization_url: data.authorization_url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not start payment." }, { status: 500 });
  }
}
