import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Public: returns the live fundraising total for a site, the manually-added
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

  // project_id only exists after migration 0026, fall back to amount-only.
  let rows: any[] | null = null;
  {
    const res = await admin
      .from("donations")
      .select("amount, project_id")
      .eq("site_id", siteId)
      .eq("status", "paid");
    rows = res.data;
    if (res.error) {
      const retry = await admin.from("donations").select("amount").eq("site_id", siteId).eq("status", "paid");
      rows = retry.data;
    }
  }

  const online = (rows || []).reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const manual = Math.max(0, Math.round(sd.donationManual || 0));

  // Per-project raised/count, keyed by project id, for the project-card bars.
  // Each project starts at its owner-entered offline amount (manualRaised),
  // then online gifts tagged to that project are added on top. The offline
  // amount is display-only, it never credits the wallet.
  const projectDefs = (sd.donationProjects || []) as { id: string; manualRaised?: number }[];
  const projects: Record<string, { raised: number; count: number; manual: number }> = {};
  for (const p of projectDefs) {
    if (!p?.id) continue;
    const m = Math.max(0, Math.round(p.manualRaised || 0));
    projects[p.id] = { raised: m, count: 0, manual: m };
  }
  for (const r of rows || []) {
    if (!r.project_id) continue;
    const p = (projects[r.project_id] ||= { raised: 0, count: 0, manual: 0 });
    p.raised += r.amount || 0;
    p.count += 1;
  }

  return NextResponse.json({
    online,
    manual,
    raised: manual + online,
    count: (rows || []).length,
    goal: Math.max(0, Math.round(sd.donationGoal || 0)),
    enabled: !!sd.donationEnabled,
    canDonate: !!site?.paystack_subaccount,
    projects,
  });
}
