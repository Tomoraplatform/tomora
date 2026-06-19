import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { PublishedSiteView } from "@/components/published/published-site-view";
import type { Product } from "@/lib/database.types";

export const metadata = { title: "Preview — Tomora" };

/** Owner-only preview of their site, rendered even when it is not live. */
export default async function PreviewPage() {
  const { site } = await getDashboardData();
  const supabase = createClient();

  let products: Product[] = [];
  if (site!.category === "ecommerce") {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("site_id", site!.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    products = (data as Product[]) || [];
  }

  return (
    <div className="relative">
      <div className="sticky top-0 z-[60] flex items-center justify-between bg-ink px-4 py-2 text-sm text-cream">
        <span className="font-medium">Preview — this is how your site looks{site!.is_live ? "" : " (not yet published)"}.</span>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/editor" className="inline-flex items-center gap-1.5 rounded-md bg-cream/15 px-3 py-1.5 hover:bg-cream/25">
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-md bg-cream/15 px-3 py-1.5 hover:bg-cream/25">
            <X className="h-4 w-4" /> Close
          </Link>
        </div>
      </div>
      <PublishedSiteView site={site!} products={products} isLive={site!.is_live} preview />
    </div>
  );
}
