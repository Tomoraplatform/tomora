import { getDashboardData } from "@/lib/dashboard";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { siteLiveUrl } from "@/lib/site-url";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { site, sites } = await getDashboardData();
  const isEcommerce = site?.category === "ecommerce";

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/dashboard/editor", label: "Edit Site", icon: "Pencil" },
    { href: "/dashboard/templates", label: "Templates", icon: "LayoutTemplate" },
    { href: "/dashboard/brand", label: "Brand Settings", icon: "Palette" },
    ...(isEcommerce
      ? ([
          { href: "/dashboard/products", label: "Products", icon: "Package" },
          { href: "/dashboard/orders", label: "Orders", icon: "ShoppingBag" },
          { href: "/dashboard/payouts", label: "Payouts", icon: "Banknote" },
        ] as NavItem[])
      : []),
    { href: "/dashboard/domain", label: "Custom Domain", icon: "Globe" },
    { href: "/dashboard/billing", label: "Billing", icon: "CreditCard" },
    { href: "/dashboard/account", label: "Account", icon: "Settings" },
  ];

  const liveUrl = site ? siteLiveUrl(site) : null;
  const switcherSites = sites.map((s) => ({
    id: s.id,
    label: s.site_data?.businessName || s.subdomain,
  }));

  return (
    <DashboardShell items={items} liveUrl={liveUrl} sites={switcherSites} currentSiteId={site?.id}>
      {children}
    </DashboardShell>
  );
}
