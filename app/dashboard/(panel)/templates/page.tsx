import { getDashboardData } from "@/lib/dashboard";
import { FREE_PLAN_ID, getPlan } from "@/lib/constants";
import { catalogTemplate } from "@/lib/catalog";
import { getTemplateOverrides } from "@/lib/template-overrides";
import { TemplatesBrowser } from "@/components/dashboard/templates-browser";

export const metadata = { title: "Templates | Tomora" };

export default async function TemplatesPage() {
  const { site, sites, subscription } = await getDashboardData();
  const planId = subscription?.status === "active" ? subscription?.plan || "pro" : FREE_PLAN_ID;
  const plan = getPlan(planId) ?? getPlan(FREE_PLAN_ID)!;

  const overrides = await getTemplateOverrides();
  const templateName = (id: string) => overrides[id]?.displayName || catalogTemplate(id)?.name || id;

  const mySites = sites.map((s) => ({
    id: s.id,
    name: s.site_data?.businessName || s.subdomain,
    templateId: s.template_id,
    templateName: templateName(s.template_id),
    accent: catalogTemplate(s.template_id)?.accent || "#022245",
    isLive: s.is_live,
    isCurrent: s.id === site?.id,
    // The card should look like the site the owner has been editing, not the
    // template's demo content.
    siteData: s.site_data || undefined,
    customHtmlUrl: (s as { custom_html_url?: string | null }).custom_html_url || undefined,
  }));

  // Templates the user already has a site on stay visible even if archived,
  // so they can re-create their current design; all other archived/removed
  // templates are hidden from the picker.
  const usedTemplateIds = Array.from(new Set(sites.map((s) => s.template_id)));

  return (
    <TemplatesBrowser
      siteCount={sites.length}
      siteLimit={plan.siteLimit}
      planName={plan.name}
      mySites={mySites}
      overrides={overrides}
      usedTemplateIds={usedTemplateIds}
    />
  );
}
