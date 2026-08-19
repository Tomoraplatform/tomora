import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sandboxAllowed, currentMode } from "@/lib/sandbox";
import { SandboxConsole } from "@/components/dashboard/sandbox-console";
import { CATALOG_TEMPLATES } from "@/lib/catalog";
import type { Product, Site } from "@/lib/database.types";

export const metadata = { robots: { index: false, follow: false }, title: "Sandbox | Tomora" };

export default async function SandboxPage() {
  // The nav hides this from everyone else, but the page guards itself too: a
  // typed URL must not be a way in.
  if (!(await sandboxAllowed())) redirect("/dashboard");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/sandbox");

  const { data: demo } = await supabase
    .from("sites").select("*").eq("user_id", user.id).eq("is_demo", true).maybeSingle();

  let products: Product[] = [];
  let testOrders = 0;
  let testRevenue = 0;
  if (demo) {
    const [{ data: prod }, { data: orders }] = await Promise.all([
      supabase.from("products").select("*").eq("site_id", demo.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("amount, status").eq("site_id", demo.id).eq("is_test", true),
    ]);
    products = (prod as Product[]) || [];
    const paid = (orders || []).filter((o) => o.status !== "pending");
    testOrders = paid.length;
    testRevenue = paid.reduce((s, o) => s + (o.amount || 0), 0);
  }

  return (
    <SandboxConsole
      mode={await currentMode()}
      demo={(demo as Site) || null}
      products={products}
      templates={CATALOG_TEMPLATES.map((t) => ({ id: t.id, name: t.name, category: t.category }))}
      stats={{ orders: testOrders, revenue: testRevenue }}
    />
  );
}
