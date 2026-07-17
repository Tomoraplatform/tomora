import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/database.types";
import { LeadsTable } from "@/components/dashboard/leads-table";

export const metadata = { title: "Leads | Tomora" };

export default async function LeadsPage() {
  const { site } = await getDashboardData();

  const supabase = createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("site_id", site!.id)
    .order("created_at", { ascending: false });
  const leads = (data as Lead[]) || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Leads</h1>
        <p className="mt-1 text-ink/60">
          Form submissions, registrations and newsletter signups from your website.
        </p>
      </div>
      <LeadsTable leads={leads} siteName={site!.site_data?.businessName || "site"} />
    </div>
  );
}
