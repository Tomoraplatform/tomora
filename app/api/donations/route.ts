import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction } from "@/lib/paystack";
import { PAYSTACK_FEE_PERCENT } from "@/lib/constants";

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
    .select("id, is_live, paystack_subaccount, site_data")
    .eq("id", siteId)
    .maybeSingle();
  if (!site || !site.is_live || !(site.site_data as any)?.donationEnabled) {
    return NextResponse.json({ error: "Donations are not available." }, { status: 400 });
  }
  if (!site.paystack_subaccount) {
    return NextResponse.json({ error: "This organisation hasn't set up payouts yet." }, { status: 400 });
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
  };
  let { error } = await admin.from("donations").insert(
    project ? { ...row, project_id: project.id, project_name: project.name } : row
  );
  // Pre-migration fallback: retry without the project columns so giving never breaks.
  if (error && project) ({ error } = await admin.from("donations").insert(row));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    // When the org passes the fee on, the donor is charged a bit more so the
    // cause still receives the full gift. The recorded donation stays `amount`.
    const feeBearer = (site.site_data as any)?.feeBearer === "customer" ? "customer" : "owner";
    const charge = feeBearer === "customer" ? Math.round(amount * (1 + PAYSTACK_FEE_PERCENT / 100)) : amount;
    // Collected into the platform balance and credited to the organisation's
    // Tomora Wallet on confirmation; they withdraw to their connected bank.
    const init = await initTransaction({
      email: String(email),
      amountNaira: charge,
      reference,
      callbackUrl: `${origin}/?donated=1`,
      metadata: { custom_fields: [
        { display_name: "Donation", variable_name: "donation", value: name || email },
        ...(project ? [{ display_name: "Project", variable_name: "project", value: project.name }] : []),
      ] },
    });
    return NextResponse.json({ reference: init.reference, accessCode: init.access_code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not start this donation." }, { status: 502 });
  }
}
