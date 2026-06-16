import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { ProductsManager } from "@/components/dashboard/products-manager";
import type { Product } from "@/lib/database.types";

export const metadata = { title: "Products — Tomora" };

export default async function ProductsPage() {
  const { site } = await getDashboardData();
  if (site!.category !== "ecommerce") redirect("/dashboard");

  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("site_id", site!.id)
    .order("created_at", { ascending: false });

  return <ProductsManager initial={(data as Product[]) || []} />;
}
