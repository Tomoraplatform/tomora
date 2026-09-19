import type { MetadataRoute } from "next";
import { listPublishedResources } from "@/lib/resources/db";
import { listFeaturedCreatorCourses } from "@/lib/creator/db";

const BASE = "https://www.tomora.com.ng";

// Rebuilt hourly, so a newly published resource or featured course is listed
// the same day without a deploy.
export const revalidate = 3600;

/**
 * Tomora's own sitemap. Customer sites each serve their own at their own
 * address (app/sites/[type]/[value]/sitemap.xml), which is where a search
 * engine expects to find them.
 *
 * The database-backed lists are best effort: if a query fails, the static
 * pages are still returned rather than the whole sitemap erroring.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    lastModified: Date = now
  ) => ({ url: `${BASE}${path}`, lastModified, changeFrequency, priority });

  const pages: MetadataRoute.Sitemap = [
    entry("", 1, "weekly"),
    entry("/signup", 0.8, "monthly"),
    entry("/resources", 0.8, "weekly"),
    entry("/academy", 0.8, "weekly"),
    entry("/tomora-ai", 0.7, "monthly"),
    entry("/tomora-ai/designs", 0.7, "weekly"),
    entry("/live", 0.6, "monthly"),
    entry("/academy/join", 0.5, "monthly"),
    entry("/login", 0.3, "yearly"),
    entry("/terms", 0.2, "yearly"),
    entry("/privacy", 0.2, "yearly"),
  ];

  const [resources, courses] = await Promise.all([
    listPublishedResources().catch(() => []),
    listFeaturedCreatorCourses().catch(() => []),
  ]);

  for (const r of resources) {
    if (r.slug) pages.push(entry(`/resources/${r.slug}`, 0.6, "monthly", new Date(r.created_at)));
  }
  for (const c of courses) {
    if (c.creatorSlug && c.slug) pages.push(entry(`/c/${c.creatorSlug}/${c.slug}`, 0.6, "weekly"));
  }

  return pages;
}
