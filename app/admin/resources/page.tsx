import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { listAllResources } from "@/lib/resources/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResourcesManager } from "@/components/admin/resources-manager";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Resources | Admin | Tomora",
};
export const dynamic = "force-dynamic";

export default async function AdminResourcesPage() {
  await requireAdmin();
  const resources = await listAllResources();

  // Sales summary per resource, so the table can show what each one earned.
  const admin = createAdminClient();
  const { data: purchases } = await admin
    .from("resource_purchases")
    .select("resource_id, amount")
    .eq("status", "paid");

  const sales = new Map<string, { count: number; revenue: number }>();
  for (const p of purchases || []) {
    const row = sales.get(p.resource_id) || { count: 0, revenue: 0 };
    row.count += 1;
    row.revenue += p.amount || 0;
    sales.set(p.resource_id, row);
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="text-2xl font-bold text-ink">Tomora Resources</h1>
        <p className="mt-1 text-ink/60">
          Add backgrounds, sections, landing pages and full websites. Set each one Free or Paid and
          publish it. Paid resources are priced automatically by category.{" "}
          {resources.length} resource{resources.length === 1 ? "" : "s"}.
        </p>
        <div className="mt-6">
          <ResourcesManager
            resources={resources}
            sales={Object.fromEntries(sales)}
          />
        </div>
      </div>
    </div>
  );
}
