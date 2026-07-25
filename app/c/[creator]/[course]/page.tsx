import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicCreatorCourse } from "@/lib/creator/db";
import { readSalesPage } from "@/lib/creator/sales-page";
import { SalesPageView } from "@/components/creator/sales-page-view";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";

export const dynamic = "force-dynamic";

interface Params { params: { creator: string; course: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getPublicCreatorCourse(params.creator, params.course);
  if (!data) return { title: "Course not found" };
  const { creator, course } = data;
  return {
    title: `${course.title} | ${creator.brand_name || creator.author_name}`,
    description: course.description || undefined,
    openGraph: {
      type: "website",
      title: course.title,
      description: course.description || undefined,
      ...(course.banner_url ? { images: [{ url: course.banner_url }] } : {}),
    },
  };
}

export default async function CreatorSalesPage({ params }: Params) {
  if (!(await academyOpen())) return <AcademyClosed />;

  const data = await getPublicCreatorCourse(params.creator, params.course);
  if (!data) notFound();
  const { creator, course } = data;
  const page = readSalesPage(course.sales_page, course);

  const base = `/c/${creator.slug}`;
  const ctaHref = (courseId?: string, url?: string) => {
    if (url) return url;
    // Link to another of this creator's courses when chosen, else this one.
    return `${base}/${course.slug}/checkout${courseId && courseId !== course.id ? `?course=${courseId}` : ""}`;
  };

  return <SalesPageView page={page} creator={creator} course={course} ctaHref={ctaHref} />;
}
