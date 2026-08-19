import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { siteLiveUrl } from "@/lib/site-url";
import { catalogTemplate } from "@/lib/catalog";
import { currentMode, sandboxAllowed } from "@/lib/sandbox";
import { ModeSwitch, TestModeFrame } from "@/components/dashboard/mode-switch";

export const metadata = { robots: { index: false, follow: false } };

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { site, sites, isStaff, staffAreas } = await getDashboardData();
  const isEcommerce = site?.category === "ecommerce";
  // Restaurants are ecommerce sites on a food template; they get one extra page.
  const isRestaurant = catalogTemplate(site?.template_id || "")?.category === "food";

  const supabase = createClient();
  const mode = await currentMode();
  const canSandbox = await sandboxAllowed();

  // Badge counts (new paid orders + unread chats), fetched in parallel.
  let newOrders = 0;
  let unreadMessages = 0;
  if (site) {
    const [ordersRes, messagesRes] = await Promise.all([
      isEcommerce
        ? supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("site_id", site.id)
            .eq("status", "paid")
            .eq("seen", false)
            .eq("is_test", mode === "test")
        : Promise.resolve({ count: 0 }),
      supabase
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("site_id", site.id)
        .eq("sender", "visitor")
        .eq("seen", false),
    ]);
    newOrders = ordersRes.count ?? 0;
    unreadMessages = messagesRes.count ?? 0;
  }

  const allItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/dashboard/editor", label: "Edit Site", icon: "Pencil" },
    { href: "/dashboard/templates", label: "Templates", icon: "LayoutTemplate" },
    { href: "/dashboard/milestones", label: "Milestones", icon: "Trophy" },
    { href: "/dashboard/brand", label: "Brand Settings", icon: "Palette" },
    ...(isRestaurant
      ? ([{ href: "/dashboard/restaurant", label: "Restaurant", icon: "UtensilsCrossed" }] as NavItem[])
      : []),
    ...(isEcommerce
      ? ([
          { href: "/dashboard/products", label: isRestaurant ? "Menu items" : "Products", icon: "Package" },
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
    { href: "/dashboard/staff", label: "Staff", icon: "UsersRound" },
    { href: "/dashboard/billing", label: "Billing", icon: "CreditCard" },
    { href: "/dashboard/account", label: "Account", icon: "Settings" },
    { href: "/dashboard/help", label: "Help & Support", icon: "LifeBuoy" },
    // Admin-only: a place to rehearse a whole sale without touching real money.
    ...(canSandbox ? ([{ href: "/dashboard/sandbox", label: "Sandbox", icon: "FlaskConical" }] as NavItem[]) : []),
  ];

  // Staff logins only see the areas they've been granted (plus basics).
  const STAFF_NAV: Record<string, string[]> = {
    orders: ["/dashboard/orders"],
    products: ["/dashboard/products"],
    editor: ["/dashboard/editor", "/dashboard/discounts", "/dashboard/shipping", "/dashboard/donations"],
    messages: ["/dashboard/messages"],
    leads: ["/dashboard/leads"],
    reviews: ["/dashboard/reviews"],
  };
  const staffAllowed = new Set([
    "/dashboard", "/dashboard/account", "/dashboard/help",
    ...staffAreas.flatMap((a) => STAFF_NAV[a] || []),
  ]);
  const items = isStaff ? allItems.filter((i) => staffAllowed.has(i.href)) : allItems;

  const liveUrl = site ? siteLiveUrl(site) : null;
  const switcherSites = sites.map((s) => ({
    id: s.id,
    label: s.site_data?.businessName || s.subdomain,
  }));

  return (
    <DashboardShell
      items={items} liveUrl={liveUrl} sites={switcherSites} currentSiteId={site?.id}
      modeSwitch={canSandbox ? <ModeSwitch mode={mode} /> : null}
    >
      {mode === "test" && <TestModeFrame />}
      {children}
    </DashboardShell>
  );
}
