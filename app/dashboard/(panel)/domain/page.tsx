import { getDashboardData } from "@/lib/dashboard";
import { DomainManager } from "@/components/dashboard/domain-manager";
import { APP_DOMAIN } from "@/lib/constants";

export const metadata = { title: "Custom Domain — Tomora" };

export default async function DomainPage() {
  const { site, subscription } = await getDashboardData();
  return (
    <DomainManager
      initialDomain={site!.custom_domain}
      initialStatus={site!.domain_status}
      isPro={subscription?.status === "active"}
      subdomain={site!.subdomain}
      appDomain={APP_DOMAIN}
    />
  );
}
