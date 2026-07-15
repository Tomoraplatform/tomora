import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedSite } from "@/lib/published";
import { ChronovaContact } from "@/components/published/chronova/chronova-contact";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params { params: { type: string; value: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  const name = data?.site.site_data?.businessName || "Store";
  return { title: `Contact — ${name}` };
}

export default async function ContactPage({ params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data || !data.isLive || data.site.template_id !== "shop-07") notFound();
  return <ChronovaContact site={data.site} paystackEnabled={!!data.site.paystack_subaccount} />;
}
