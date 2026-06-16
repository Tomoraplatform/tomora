import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { OrdersManager } from "@/components/dashboard/orders-manager";
import type { Order, Product } from "@/lib/database.types";

export const metadata = { title: "Orders — Tomora" };

export default async function OrdersPage() {
  const { site } = await getDashboardData();
  if (site!.category !== "ecommerce") redirect("/dashboard");

  const supabase = createClient();
  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from("orders").select("*").eq("site_id", site!.id).order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").eq("site_id", site!.id),
  ]);

  const names: Record<string, string> = {};
  (products as Pick<Product, "id" | "name">[] | null)?.forEach((p) => { names[p.id] = p.name; });

  return <OrdersManager initial={(orders as Order[]) || []} productNames={names} />;
}
