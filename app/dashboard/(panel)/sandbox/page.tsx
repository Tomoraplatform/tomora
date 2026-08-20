import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sandboxAllowed, currentMode } from "@/lib/sandbox";
import { DEMO_SITE_COOKIE } from "@/lib/dashboard";
import { cookies } from "next/headers";
import { SandboxConsole, type SandboxOrder } from "@/components/dashboard/sandbox-console";
import { CATALOG_TEMPLATES } from "@/lib/catalog";
import type { Order, Product, Site } from "@/lib/database.types";

export const metadata = { robots: { index: false, follow: false }, title: "Sandbox | Tomora" };

export default async function SandboxPage() {
  // The nav hides this from everyone else, but the page guards itself too: a
  // typed URL must not be a way in.
  if (!(await sandboxAllowed())) redirect("/dashboard");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/sandbox");

  const { data: siteRows } = await supabase
    .from("sites").select("*").eq("user_id", user.id).eq("is_demo", true)
    .order("created_at", { ascending: true });
  const demoSites = (siteRows as Site[]) || [];

  const chosen = cookies().get(DEMO_SITE_COOKIE)?.value;
  const active = demoSites.find((s) => s.id === chosen) || demoSites[0] || null;

  let products: Product[] = [];
  let orders: SandboxOrder[] = [];
  if (active) {
    const [{ data: prod }, { data: rows }] = await Promise.all([
      supabase.from("products").select("*").eq("site_id", active.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("site_id", active.id).eq("is_test", true)
        .order("created_at", { ascending: false }).limit(400),
    ]);
    products = (prod as Product[]) || [];

    // One order is stored as a row per item, so group them back the way the
    // real Orders screen does before showing quantities and totals.
    const names = new Map(products.map((p) => [p.id, p.name]));
    const groups = new Map<string, SandboxOrder>();
    for (const row of ((rows as Order[]) || [])) {
      const key = row.paystack_reference || `row:${row.id}`;
      const existing = groups.get(key);
      const line = {
        name: (row.product_id && names.get(row.product_id)) || row.color || "Item",
        qty: Number((row.color || "").match(/^x(\d+)$/)?.[1] || 1),
        amount: row.amount || 0,
      };
      if (existing) {
        existing.total += line.amount;
        existing.items.push(line);
      } else {
        groups.set(key, {
          reference: key, createdAt: row.created_at, status: row.status,
          buyer: row.buyer_name, total: line.amount, items: [line],
        });
      }
    }
    orders = Array.from(groups.values());
  }

  return (
    <SandboxConsole
      mode={await currentMode()}
      sites={demoSites.map((s) => ({
        id: s.id, name: s.site_data?.businessName || s.subdomain, templateId: s.template_id,
      }))}
      activeId={active?.id || null}
      products={products}
      orders={orders}
      templates={CATALOG_TEMPLATES.map((t) => ({ id: t.id, name: t.name, category: t.category }))}
    />
  );
}
