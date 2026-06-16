import { getDashboardData } from "@/lib/dashboard";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { APP_DOMAIN } from "@/lib/constants";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { site, profile } = await getDashboardData();
  const isEcommerce = site?.category === "ecommerce";

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/dashboard/editor", label: "Edit Site", icon: "Pencil" },
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

  const liveUrl = site
    ? site.custom_domain && site.domain_status === "active"
      ? `https://${site.custom_domain}`
      : `https://${site.subdomain}.${APP_DOMAIN}`
    : null;

  return (
    <DashboardShell items={items} businessName={profile?.business_name || "My Site"} liveUrl={liveUrl}>
      {children}
    </DashboardShell>
  );
}
