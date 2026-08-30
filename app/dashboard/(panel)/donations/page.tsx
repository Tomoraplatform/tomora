import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { reconcilePendingDonations } from "@/lib/confirm-payments";
import { summariseDonations, type PaidGift, type ProjectDef } from "@/lib/donations/totals";
import { DonationsManager, type DonationRecord, type ProjectSummary } from "@/components/dashboard/donations-manager";

export const metadata = { title: "Donations | Tomora" };

export default async function DonationsPage() {
  const { site } = await getDashboardData();
  const sd = site!.site_data || {};
  const eligible = site!.category === "organization" || !!sd.donationEnabled;
  if (!eligible) redirect("/dashboard");

  // Settle any donations whose Paystack charge succeeded but whose donor never
  // returned to fire the browser confirm (marks paid + credits the wallet).
  try { await reconcilePendingDonations(site!.id); } catch { /* best-effort */ }

  // Paid online (Paystack) donations. project_* columns arrive with migration
  // 0026, fall back to the amount-only shape if it hasn't been applied yet.
  const admin = createAdminClient();
  let rows: any[] = [];
  {
    const res = await admin
      .from("donations")
      .select("id, donor_name, donor_email, amount, project_id, project_name, created_at")
      .eq("site_id", site!.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false });
    if (res.error) {
      const retry = await admin
        .from("donations")
        .select("id, donor_name, donor_email, amount, created_at")
        .eq("site_id", site!.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false });
      rows = retry.data || [];
    } else {
      rows = res.data || [];
    }
  }

  const online = rows.reduce((s, r) => s + (r.amount || 0), 0);

  // Per-project summaries from the owner's configured projects + paid gifts.
  // Same attribution the public progress bars use, so the owner and their
  // donors never see two different numbers for one project.
  const defs = (sd.donationProjects || []).filter((p) => p.name?.trim());
  const { projects: totals, unassigned } = summariseDonations(rows as PaidGift[], defs as ProjectDef[]);

  const projects: ProjectSummary[] = defs.map((p) => ({
    id: p.id,
    name: p.name,
    goal: Math.max(0, Math.round(p.goal || 0)),
    raised: totals[p.id]?.raised ?? 0,
    count: totals[p.id]?.count ?? 0,
  }));

  const records: DonationRecord[] = rows.slice(0, 50).map((r) => ({
    id: r.id,
    donorName: r.donor_name || null,
    donorEmail: r.donor_email || null,
    amount: r.amount || 0,
    projectName: r.project_name || null,
    createdAt: r.created_at,
  }));

  return (
    <div className="space-y-6">
      {!sd.donationEnabled && (
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">Your donation section is currently hidden. Turn it on in the editor to show the progress bar on your site.</p>
          <Link href="/dashboard/editor" className="shrink-0 text-sm font-semibold text-amber-900 underline">Open editor</Link>
        </div>
      )}
      <DonationsManager
        online={online}
        onlineCount={rows.length}
        unassignedCount={unassigned.count}
        unassignedRaised={unassigned.raised}
        manual={Math.max(0, Math.round(sd.donationManual || 0))}
        goal={Math.max(0, Math.round(sd.donationGoal || 0))}
        projects={projects}
        records={records}
      />
    </div>
  );
}
