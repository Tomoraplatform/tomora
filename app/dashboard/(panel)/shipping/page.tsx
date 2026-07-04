import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { ShippingManager } from "@/components/dashboard/shipping-manager";

export const metadata = { title: "Shipping — Tomora" };

export default async function ShippingPage() {
  const { site } = await getDashboardData();
  if (site!.category !== "ecommerce") redirect("/dashboard");

  return <ShippingManager initial={site!.site_data?.shippingZones || []} />;
}
