import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { siteLiveUrl } from "@/lib/site-url";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { site, sites } = await getDashboardData();
  const isEcommerce = site?.category === "ecommerce";

  const supabase = createClient();

  // Count of paid orders the owner hasn't viewed yet (for the "new" badge).
  let newOrders = 0;
  if (isEcommerce && site) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("site_id", site.id)
      .eq("status", "paid")
      .eq("seen", false);
    newOrders = count ?? 0;
  }

  // Unread visitor chat messages (for the Messages badge).
  let unreadMessages = 0;
  if (site) {
    const { count } = await supabase
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("site_id", site.id)
      .eq("sender", "visitor")
      .eq("seen", false);
    unreadMessages = count ?? 0;
  }

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/dashboard/editor", label: "Edit Site", icon: "Pencil" },
    { href: "/dashboard/templates", label: "Templates", icon: "LayoutTemplate" },
    { href: "/dashboard/milestones", label: "Milestones", icon: "Trophy" },
    { href: "/dashboard/brand", label: "Brand Settings", icon: "Palette" },
    ...(isEcommerce
      ? ([
          { href: "/dashboard/products", label: "Products", icon: "Package" },
          { href: "/dashboard/orders", label: "Orders", icon: "ShoppingBag", badge: newOrders },
          { href: "/dashboard/discounts", label: "Discounts", icon: "Ticket" },
          { href: "/dashboard/shipping", label: "Shipping", icon: "Truck" },
          { href: "/dashboard/reviews", label: "Reviews", icon: "Star" },
          { href: "/dashboard/payouts", label: "Payouts", icon: "Banknote" },
        ] as NavItem[])
      : []),
    ...(site && site.category !== "ecommerce" && (site.category === "organization" || site.site_data?.donationEnabled)
      ? ([{ href: "/dashboard/payouts", label: "Payouts", icon: "Banknote" }] as NavItem[])
      : []),
    ...(site && (site.category === "organization" || site.site_data?.donationEnabled)
      ? ([{ href: "/dashboard/donations", label: "Donations", icon: "Heart" }] as NavItem[])
      : []),
    ...(site && (site.category === "ecommerce" || site.category === "organization" || site.site_data?.donationEnabled)
      ? ([{ href: "/dashboard/wallet", label: "Tomora Wallet", icon: "Wallet" }] as NavItem[])
      : []),
    { href: "/dashboard/messages", label: "Messages", icon: "MessagesSquare", badge: unreadMessages },
    { href: "/dashboard/leads", label: "Leads", icon: "Inbox" },
    { href: "/dashboard/domain", label: "Custom Domain", icon: "Globe" },
    { href: "/dashboard/billing", label: "Billing", icon: "CreditCard" },
    { href: "/dashboard/account", label: "Account", icon: "Settings" },
    { href: "/dashboard/help", label: "Help & Support", icon: "LifeBuoy" },
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
