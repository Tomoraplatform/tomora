import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Public: returns the live fundraising total for a site — the manually-added
 * (offline) amount plus the sum of paid online donations, the goal, and the
 * number of online donors. Powers the donation progress bar.
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  const siteId = new URL(request.url).searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "Missing site." }, { status: 400 });

  const { data: site } = await admin
    .from("sites")
    .select("site_data, paystack_subaccount")
    .eq("id", siteId)
    .maybeSingle();
  const sd = (site?.site_data as any) || {};

  const { data: rows } = await admin
    .from("donations")
    .select("amount")
    .eq("site_id", siteId)
    .eq("status", "paid");

  const online = (rows || []).reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const manual = Math.max(0, Math.round(sd.donationManual || 0));
  return NextResponse.json({
    raised: manual + online,
    count: (rows || []).length,
    goal: Math.max(0, Math.round(sd.donationGoal || 0)),
    enabled: !!sd.donationEnabled,
    canDonate: !!site?.paystack_subaccount,
  });
}
