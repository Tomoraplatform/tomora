import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getResourceCard, hasPurchased, bumpCounter } from "@/lib/resources/db";
import { ACCESS_COOKIE, readAccessToken } from "@/lib/resources/access";
import { ResourceDetail } from "@/components/resources/resource-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const resource = await getResourceCard(params.slug);
  if (!resource) return { title: "Resource not found" };
  return {
    title: resource.title,
    description: resource.description,
    openGraph: { title: resource.title, description: resource.description },
  };
}

export default async function ResourcePage({ params }: { params: { slug: string } }) {
  const resource = await getResourceCard(params.slug);
  if (!resource || !resource.is_published) notFound();

  const email = readAccessToken(cookies().get(ACCESS_COOKIE)?.value);
  const owned = resource.is_paid ? !!email && (await hasPurchased(resource.id, email)) : true;

  // Best effort view count; never block the render on it.
  bumpCounter(resource.id, "views").catch(() => {});

  return <ResourceDetail resource={resource} owned={owned} email={email} />;
}
