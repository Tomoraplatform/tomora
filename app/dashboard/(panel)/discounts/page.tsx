import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { DiscountsManager } from "@/components/dashboard/discounts-manager";

export const metadata = { title: "Discounts & Coupons | Tomora" };

export default async function DiscountsPage() {
  const { site } = await getDashboardData();
  if (site!.category !== "ecommerce") redirect("/dashboard");

  return <DiscountsManager initial={site!.site_data?.coupons || []} />;
}
