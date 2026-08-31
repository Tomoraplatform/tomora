import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedSite } from "@/lib/published";
import { ChronovaContact } from "@/components/published/chronova/chronova-contact";

// Cached and served from the edge, then dropped the moment the owner changes
// anything (see lib/site-cache.ts). The five minutes is only a backstop for a
// write path that forgets to invalidate, kept short while the invalidation
// paths earn trust in production.
export const revalidate = 300;

interface Params { params: { type: string; value: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  const name = data?.site.site_data?.businessName || "Store";
  return { title: `Contact | ${name}` };
}

export default async function ContactPage({ params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data || !data.isLive || data.site.template_id !== "shop-07") notFound();
  return <ChronovaContact site={data.site} paystackEnabled={!!data.site.paystack_subaccount} />;
}
