import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { DonationsManager } from "@/components/dashboard/donations-manager";

export const metadata = { title: "Donations — Tomora" };

export default async function DonationsPage() {
  const { site } = await getDashboardData();
  const sd = site!.site_data || {};
  const eligible = site!.category === "organization" || !!sd.donationEnabled;
  if (!eligible) redirect("/dashboard");

  // Sum online (Paystack) donations that have been paid.
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("donations")
    .select("amount")
    .eq("site_id", site!.id)
    .eq("status", "paid");
  const online = (rows || []).reduce((s: number, r: { amount: number | null }) => s + (r.amount || 0), 0);

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
        onlineCount={(rows || []).length}
        manual={Math.max(0, Math.round(sd.donationManual || 0))}
        goal={Math.max(0, Math.round(sd.donationGoal || 0))}
      />
    </div>
  );
}
