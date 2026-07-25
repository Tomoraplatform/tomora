import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCreatorBySlug, listCreatorCourses } from "@/lib/creator/db";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";
import { CreatorStorefront } from "@/components/creator/creator-storefront";

export const dynamic = "force-dynamic";

interface Params { params: { creator: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const creator = await getCreatorBySlug(params.creator);
  if (!creator) return { title: "Not found" };
  const name = creator.brand_name || creator.author_name;
  return {
    title: name,
    description: creator.author_bio || `Courses by ${name}`,
    openGraph: {
      type: "website", title: name, description: creator.author_bio || undefined,
      ...(creator.logo_url ? { images: [{ url: creator.logo_url }] } : {}),
    },
  };
}

export default async function CreatorHomePage({ params }: Params) {
  if (!(await academyOpen())) return <AcademyClosed />;

  const creator = await getCreatorBySlug(params.creator);
  if (!creator) notFound();

  const all = await listCreatorCourses(creator.id);
  const live = all.filter((c) => c.is_published && c.is_active);

  return (
    <CreatorStorefront
      creator={creator}
      courses={live}
      hrefFor={(slug) => `/c/${creator.slug}/${slug}`}
    />
  );
}
