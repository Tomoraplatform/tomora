import { getDashboardData } from "@/lib/dashboard";
import { DomainManager } from "@/components/dashboard/domain-manager";
import { APP_DOMAIN, EXTRA_DOMAIN_AMOUNT } from "@/lib/constants";
import { domainAccess } from "@/lib/domain-access";

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

  return (
    <DomainManager
      initialDomain={site!.custom_domain}
      initialStatus={site!.domain_status}
      canConnect={access.canConnect}
      included={access.included}
      domainPurchased={!!site!.domain_purchased}
      extraDomainAmount={EXTRA_DOMAIN_AMOUNT}
      siteId={site!.id}
      subdomain={site!.subdomain}
      appDomain={APP_DOMAIN}
    />
  );
}
