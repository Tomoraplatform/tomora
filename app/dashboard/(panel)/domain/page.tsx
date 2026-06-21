import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { DomainManager } from "@/components/dashboard/domain-manager";
import { APP_DOMAIN, NEW_DOMAIN_AMOUNT } from "@/lib/constants";
import { domainAccess } from "@/lib/domain-access";
import type { DomainRequest } from "@/lib/database.types";

export const metadata = { title: "Custom Domain — Tomora" };

export default async function DomainPage() {
  const { site, sites, subscription } = await getDashboardData();
  const isPrimary = sites[0]?.id === site!.id;
  const access = domainAccess({
    isPrimary,
    domainPurchased: !!site!.domain_purchased,
    planId: subscription?.plan,
    subActive: subscription?.status === "active",
  });

  const supabase = createClient();
  const { data: reqs } = await supabase
    .from("domain_requests")
    .select("*")
    .eq("site_id", site!.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  const requests = (reqs as DomainRequest[]) || [];

  return (
    <DomainManager
      initialDomain={site!.custom_domain}
      initialStatus={site!.domain_status}
      included={access.included}
      newDomainAmount={NEW_DOMAIN_AMOUNT}
      requests={requests}
      siteId={site!.id}
      subdomain={site!.subdomain}
      appDomain={APP_DOMAIN}
    />
  );
}
