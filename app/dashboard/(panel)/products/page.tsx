import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Banknote } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
  const products = (data as Product[]) || [];

  // Guide first-time setup: once products are added but the store isn't published,
  // point owners to the next step (bank payout), then publishing.
  const inSetup = !site!.is_live;
  const payoutConnected = !!site!.paystack_subaccount;

  return (
    <div className="space-y-6">
      <ProductsManager initial={products} />

      {inSetup && products.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-ink/15 bg-cream/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">Next: {payoutConnected ? "publish your store" : "set up your bank payout"}</p>
            <p className="text-sm text-ink/60">{payoutConnected ? "Your store isn't live yet — open the editor to review and publish." : "Add the bank account where your sales should be paid out."}</p>
          </div>
          {payoutConnected ? (
            <Button asChild><Link href="/dashboard/editor">Review &amp; publish <ArrowRight className="h-4 w-4" /></Link></Button>
          ) : (
            <Button asChild><Link href="/dashboard/payouts"><Banknote className="h-4 w-4" /> Continue to bank payout</Link></Button>
          )}
        </div>
      )}
    </div>
  );
}
