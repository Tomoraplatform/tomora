import { getDashboardData } from "@/lib/dashboard";
import { getPlan } from "@/lib/constants";
import { catalogTemplate } from "@/lib/catalog";
import { TemplatesBrowser } from "@/components/dashboard/templates-browser";

export const metadata = { title: "Templates — Tomora" };

export default async function TemplatesPage() {
  const { site, sites, subscription } = await getDashboardData();
  const planId = subscription?.status === "active" ? subscription?.plan || "pro" : "trial";
  const plan = getPlan(planId) ?? getPlan("trial")!;

  const mySites = sites.map((s) => ({
    id: s.id,
    name: s.site_data?.businessName || s.subdomain,
    templateId: s.template_id,
    templateName: catalogTemplate(s.template_id)?.name || s.template_id,
    accent: catalogTemplate(s.template_id)?.accent || "#022245",
    isLive: s.is_live,
    isCurrent: s.id === site?.id,
  }));

  return (
    <TemplatesBrowser
      siteCount={sites.length}
      siteLimit={plan.siteLimit}
      planName={plan.name}
      mySites={mySites}
    />
  );
}
