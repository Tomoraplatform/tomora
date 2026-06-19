import { getDashboardData } from "@/lib/dashboard";
import { getPlan } from "@/lib/constants";
import { TemplatesBrowser } from "@/components/dashboard/templates-browser";

export const metadata = { title: "Templates — Tomora" };

export default async function TemplatesPage() {
  const { sites, subscription } = await getDashboardData();
  const planId = subscription?.status === "active" ? subscription?.plan || "pro" : "trial";
  const plan = getPlan(planId) ?? getPlan("trial")!;

  return (
    <TemplatesBrowser
      siteCount={sites.length}
      siteLimit={plan.siteLimit}
      planName={plan.name}
    />
  );
}
