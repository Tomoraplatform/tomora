import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { catalogTemplate } from "@/lib/catalog";
import { RestaurantSettings } from "@/components/dashboard/restaurant-settings";
import { combosOf } from "@/lib/restaurant/types";

export const metadata = { title: "Restaurant | Tomora" };

export default async function RestaurantPage() {
  const { site } = await getDashboardData();
  // Only sites on a food template have anything to configure here.
  if (catalogTemplate(site!.template_id)?.category !== "food") redirect("/dashboard");

  // Combos live at the top level, edited here and in the site editor alike.
  const sd = site!.site_data;
  return <RestaurantSettings initial={{ ...(sd?.restaurant || {}), combos: combosOf(sd) }} />;
}
