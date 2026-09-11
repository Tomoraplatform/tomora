import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction } from "@/lib/paystack";
import { PAYSTACK_FEE_PERCENT } from "@/lib/constants";
import { feePolicyForOwner, type FeePolicy } from "@/lib/plan-fees";
import { quoteCharge } from "@/lib/platform-fee";
import { recordPaymentCharge } from "@/lib/payment-charges";

/**
 * Starts an online donation: records a pending row and initializes a Paystack
 * transaction server-side (settles to the org's subaccount). The popup resumes
 * the returned access code. Amounts are validated server-side.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { siteId, name, email } = body || {};
  const amount = Math.round(Number(body?.amount) || 0);
  if (!siteId || !email || amount < 100) {
    return NextResponse.json({ error: "Enter your email and an amount of at least ₦100." }, { status: 400 });
  }

  const { data: site } = await admin
    .from("sites")
    .select("id, is_live, paystack_subaccount, site_data, user_id")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || !site.is_live || !(site.site_data as any)?.donationEnabled) {
    return NextResponse.json({ error: "Donations are not available." }, { status: 400 });
  }
  if (!site.paystack_subaccount) {
    return NextResponse.json({ error: "This organisation hasn't set up payouts yet." }, { status: 400 });
  }

  // The organisation's plan decides Tomora's transaction fee on the gift.
  let policy: FeePolicy;
  try {
    policy = await feePolicyForOwner(site.user_id as string);
  } catch (e) {
    console.error("[donations] could not resolve the site's plan:", e);
    return NextResponse.json({ error: "Giving is briefly unavailable. Please try again in a moment." }, { status: 503 });
  }

  // Resolve the named project this gift is for (multi-project fundraising).
  const projects = ((site.site_data as any)?.donationProjects || []) as { id: string; name: string }[];
  const project = body?.projectId ? projects.find((p) => p.id === body.projectId) : undefined;

  const reference = `don_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const row: Record<string, unknown> = {
    site_id: siteId,
    donor_name: name ? String(name).slice(0, 120) : null,
    donor_email: String(email).slice(0, 160),
    amount,
    paystack_reference: reference,
    status: "pending",
    // Split at Paystack to the organisation's payout account, so the money
    // never sits in Tomora's balance and must not be withdrawable from the
    // wallet. See migration 0044.
    settled_direct: true,
  };
  const withProject = project ? { ...row, project_id: project.id, project_name: project.name } : row;
  let { error } = await admin.from("donations").insert(withProject);
  // Pre-migration fallbacks, so giving never breaks on a database that has not
  // caught up: drop the newest column first, then the project columns.
  if (error) {
    const { settled_direct: _drop, ...noFlag } = withProject as Record<string, unknown>;
    ({ error } = await admin.from("donations").insert(noFlag));
  }
  if (error && project) {
    const { settled_direct: _drop2, ...bare } = row as Record<string, unknown>;
    ({ error } = await admin.from("donations").insert(bare));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    // Tomora's fee, when the plan has one, is added on top of the gift. When
    // the org passes Paystack's fee on too, the donor is charged a bit more
    // again so the cause still receives the full gift. The recorded donation
    // stays `amount` either way, which is what the progress bar counts.
    const feeBearer = (site.site_data as any)?.feeBearer === "customer" ? "customer" : "owner";
    const quote = quoteCharge(amount, policy.rate, feeBearer === "customer" ? PAYSTACK_FEE_PERCENT : 0);
    const charge = quote.totalCharged;
    await recordPaymentCharge({
      reference, kind: "donation", siteId, ownerId: site.user_id as string, policy, quote,
    });
    // Split to the organisation's own payout account: the gift lands in their
    // bank, not Tomora's. They bear Paystack's fee. Tomora's fee goes to its
    // main account as transaction_charge, never out of the gift.
    const init = await initTransaction({
      email: String(email),
      amountNaira: charge,
      reference,
      subaccount: site.paystack_subaccount as string,
      bearer: "subaccount",
      transactionCharge: quote.platformFee > 0 ? quote.platformFee : undefined,
      callbackUrl: `${origin}/?donated=1`,
      metadata: { custom_fields: [
        { display_name: "Donation", variable_name: "donation", value: name || email },
        ...(project ? [{ display_name: "Project", variable_name: "project", value: project.name }] : []),
      ] },
    });
    return NextResponse.json({
      reference: init.reference, accessCode: init.access_code,
      amount, platformFee: quote.platformFee, processingFee: charge - amount, charge,
    });
  } catch (e: any) {
    // The organisation's payout account, not anything the donor can fix.
    if (/subaccount/i.test(String(e?.message))) {
      console.error(`[donations] Paystack rejected the payout account of site ${siteId}: ${e.message}`);
      return NextResponse.json({ error: "Online giving isn't available here right now. Please contact the organisation." }, { status: 502 });
    }
    return NextResponse.json({ error: e.message || "Could not start this donation." }, { status: 502 });
  }
}
