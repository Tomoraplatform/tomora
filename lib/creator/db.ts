import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AcademyCreator {
  id: string;
  student_id: string;
  slug: string;
  author_name: string;
  author_bio: string;
  author_photo_url: string | null;
  show_author: boolean;
  brand_name: string | null;
  logo_url: string | null;
  brand_color: string;
  brand_color_2: string;
  bank_name: string | null;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  custom_domain?: string | null;
  domain_status?: string;
  created_at: string;
}

export interface CreatorCourse {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string;
  banner_url: string | null;
  price: number;
  compare_price: number | null;
  is_published: boolean;
  is_active: boolean;
  sales_page: Record<string, unknown>;
  featured_at: string | null;
  purchases: number;
  created_at: string;
}

export interface CreatorModule {
  id: string; course_id: string; title: string; sort_order: number;
}

export type LessonType = "video" | "link" | "pdf";

export interface CreatorLesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  description: string;
  lesson_type: LessonType;
  media_path: string | null;
  media_url: string | null;
  is_preview: boolean;
  sort_order: number;
}

export type CreatorCourseWithContent = CreatorCourse & {
  modules: (CreatorModule & { lessons: CreatorLesson[] })[];
  lessonCount: number;
};

/** The creator profile for an academy student, or null. */
export async function getCreatorByStudent(studentId: string): Promise<AcademyCreator | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("academy_creators").select("*").eq("student_id", studentId).maybeSingle();
  return (data as AcademyCreator) || null;
}

/** Creator whose connected custom domain matches this host. */
export async function getCreatorByDomain(host: string): Promise<AcademyCreator | null> {
  const clean = (host || "").toLowerCase().replace(/^www\./, "");
  if (!clean) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("academy_creators").select("*")
    .eq("custom_domain", clean).eq("domain_status", "active").maybeSingle();
  return (data as AcademyCreator) || null;
}

export async function getCreatorBySlug(slug: string): Promise<AcademyCreator | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("academy_creators").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
  return (data as AcademyCreator) || null;
}

/** All courses belonging to a creator (their dashboard). */
export async function listCreatorCourses(creatorId: string): Promise<(CreatorCourse & { lessonCount: number })[]> {
  const admin = createAdminClient();
  const { data: courses } = await admin.from("creator_courses").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false });
  const list = (courses as CreatorCourse[]) || [];
  if (!list.length) return [];
  const { data: lessons } = await admin.from("creator_lessons").select("course_id").in("course_id", list.map((c) => c.id));
  const counts: Record<string, number> = {};
  (lessons as { course_id: string }[] | null)?.forEach((l) => { counts[l.course_id] = (counts[l.course_id] || 0) + 1; });
  return list.map((c) => ({ ...c, lessonCount: counts[c.id] || 0 }));
}

/** One creator course with its full curriculum. */
export async function getCreatorCourse(courseId: string): Promise<CreatorCourseWithContent | null> {
  const admin = createAdminClient();
  const { data: course } = await admin.from("creator_courses").select("*").eq("id", courseId).maybeSingle();
  if (!course) return null;
  const [{ data: mods }, { data: lessons }] = await Promise.all([
    admin.from("creator_modules").select("*").eq("course_id", course.id).order("sort_order"),
    admin.from("creator_lessons").select("*").eq("course_id", course.id).order("sort_order"),
  ]);
  const byModule: Record<string, CreatorLesson[]> = {};
  (lessons as CreatorLesson[] | null)?.forEach((l) => { (byModule[l.module_id] ||= []).push(l); });
  const modules = ((mods as CreatorModule[]) || []).map((m) => ({ ...m, lessons: byModule[m.id] || [] }));
  return {
    ...(course as CreatorCourse),
    modules,
    lessonCount: (lessons as CreatorLesson[] | null)?.length || 0,
  };
}

/** A creator's published course by slug, for the public sales page. */
export async function getPublicCreatorCourse(creatorSlug: string, courseSlug: string): Promise<{ creator: AcademyCreator; course: CreatorCourseWithContent } | null> {
  const creator = await getCreatorBySlug(creatorSlug);
  if (!creator) return null;
  const admin = createAdminClient();
  const { data: row } = await admin.from("creator_courses")
    .select("id").eq("creator_id", creator.id).eq("slug", courseSlug).maybeSingle();
  if (!row) return null;
  const course = await getCreatorCourse(row.id);
  if (!course || !course.is_published || !course.is_active) return null;
  return { creator, course };
}

export async function isCreatorEnrolled(studentId: string, courseId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from("creator_enrollments").select("id").eq("student_id", studentId).eq("course_id", courseId).maybeSingle();
  return !!data;
}

/** Courses a student bought from creators (shown in their portal). */
export async function listPurchasedCreatorCourses(studentId: string): Promise<(CreatorCourse & { creatorSlug: string; lessonCount: number })[]> {
  const admin = createAdminClient();
  const { data: enrolls } = await admin.from("creator_enrollments").select("course_id").eq("student_id", studentId);
  const ids = (enrolls as { course_id: string }[] | null)?.map((e) => e.course_id) || [];
  if (!ids.length) return [];
  const [{ data: courses }, { data: lessons }] = await Promise.all([
    admin.from("creator_courses").select("*").in("id", ids),
    admin.from("creator_lessons").select("course_id").in("course_id", ids),
  ]);
  const counts: Record<string, number> = {};
  (lessons as { course_id: string }[] | null)?.forEach((l) => { counts[l.course_id] = (counts[l.course_id] || 0) + 1; });
  const creatorIds = Array.from(new Set(((courses as CreatorCourse[]) || []).map((c) => c.creator_id)));
  const { data: creators } = await admin.from("academy_creators").select("id, slug").in("id", creatorIds);
  const slugById = new Map((creators as { id: string; slug: string }[] | null)?.map((c) => [c.id, c.slug]));
  return ((courses as CreatorCourse[]) || []).map((c) => ({
    ...c, creatorSlug: slugById.get(c.creator_id) || "", lessonCount: counts[c.id] || 0,
  }));
}

/** Creator courses an admin approved onto the main Academy catalog. */
export async function listFeaturedCreatorCourses(): Promise<(CreatorCourse & { creatorSlug: string; authorName: string; lessonCount: number })[]> {
  const admin = createAdminClient();
  const { data: courses } = await admin.from("creator_courses").select("*")
    .not("featured_at", "is", null).eq("is_published", true).eq("is_active", true);
  const list = (courses as CreatorCourse[]) || [];
  if (!list.length) return [];
  const [{ data: creators }, { data: lessons }] = await Promise.all([
    admin.from("academy_creators").select("id, slug, author_name").in("id", Array.from(new Set(list.map((c) => c.creator_id)))),
    admin.from("creator_lessons").select("course_id").in("course_id", list.map((c) => c.id)),
  ]);
  const byId = new Map((creators as { id: string; slug: string; author_name: string }[] | null)?.map((c) => [c.id, c]));
  const counts: Record<string, number> = {};
  (lessons as { course_id: string }[] | null)?.forEach((l) => { counts[l.course_id] = (counts[l.course_id] || 0) + 1; });
  return list.map((c) => ({
    ...c,
    creatorSlug: byId.get(c.creator_id)?.slug || "",
    authorName: byId.get(c.creator_id)?.author_name || "",
    lessonCount: counts[c.id] || 0,
  }));
}
