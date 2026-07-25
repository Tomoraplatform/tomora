import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCreatorByDomain, getCreatorCourse } from "@/lib/creator/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { readSalesPage } from "@/lib/creator/sales-page";
import { SalesPageView } from "@/components/creator/sales-page-view";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";
import { APP_DOMAIN } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Params { params: { type: string; value: string; creatorCourse: string } }

/** Resolves a creator course by the custom domain host plus course slug. */
async function resolve(host: string, courseSlug: string) {
  const creator = await getCreatorByDomain(host);
  if (!creator) return null;
  const admin = createAdminClient();
  const { data: row } = await admin.from("creator_courses")
    .select("id").eq("creator_id", creator.id).eq("slug", courseSlug).maybeSingle();
  if (!row) return null;
  const course = await getCreatorCourse(row.id);
  if (!course || !course.is_published || !course.is_active) return null;
  return { creator, course };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (params.type !== "custom") return {};
  const data = await resolve(decodeURIComponent(params.value), params.creatorCourse);
  if (!data) return {};
  return {
    title: `${data.course.title} | ${data.creator.brand_name || data.creator.author_name}`,
    description: data.course.description || undefined,
    ...(data.course.banner_url ? { openGraph: { images: [{ url: data.course.banner_url }] } } : {}),
  };
}

/**
 * A creator's sales page on their own domain. Buying and learning stay on the
 * main Tomora domain, because the student session cookie lives there.
 */
export default async function CreatorDomainCoursePage({ params }: Params) {
  if (params.type !== "custom") notFound();
  const data = await resolve(decodeURIComponent(params.value), params.creatorCourse);
  if (!data) notFound();
  if (!(await academyOpen())) return <AcademyClosed />;

  const { creator, course } = data;
  const page = readSalesPage(course.sales_page, course);
  const base = `https://${APP_DOMAIN}/c/${creator.slug}`;

  const ctaHref = (courseId?: string, url?: string) => {
    if (url) return url;
    return `${base}/${course.slug}/checkout${courseId && courseId !== course.id ? `?course=${courseId}` : ""}`;
  };

  return <SalesPageView page={page} creator={creator} course={course} ctaHref={ctaHref} />;
}
