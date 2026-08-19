import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { OrdersManager } from "@/components/dashboard/orders-manager";
import type { Order, Product } from "@/lib/database.types";
import { scopeToMode } from "@/lib/orders/query";
import { currentMode } from "@/lib/sandbox";

export const metadata = { title: "Orders | Tomora" };

export default async function OrdersPage() {
  const { site } = await getDashboardData();
  if (site!.category !== "ecommerce") redirect("/dashboard");

  const supabase = createClient();
  const mode = await currentMode();
  const [{ data: orders }, { data: products }] = await Promise.all([
    scopeToMode(supabase.from("orders").select("*").eq("site_id", site!.id), mode).order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").eq("site_id", site!.id),
  ]);

  const names: Record<string, string> = {};
  (products as Pick<Product, "id" | "name">[] | null)?.forEach((p) => { names[p.id] = p.name; });

  // Mark new orders as seen so the dashboard badge clears.
  await supabase.from("orders").update({ seen: true })
    .eq("site_id", site!.id).eq("status", "paid").eq("seen", false);

  return <OrdersManager isTest={mode === "test"} initial={(orders as Order[]) || []} productNames={names} />;
}
