import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { catalogTemplate } from "@/lib/catalog";
import { RestaurantSettings } from "@/components/dashboard/restaurant-settings";

export const metadata = { title: "Restaurant | Tomora" };

export default async function RestaurantPage() {
  const { site } = await getDashboardData();
  // Only sites on a food template have anything to configure here.
  if (catalogTemplate(site!.template_id)?.category !== "food") redirect("/dashboard");

  return <RestaurantSettings initial={site!.site_data?.restaurant} />;
}
