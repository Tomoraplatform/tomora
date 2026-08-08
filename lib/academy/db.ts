import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AcademyCourse {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  thumbnail_url: string | null;
  price: number;
  /** Optional slashed price shown beside the real one. */
  compare_price?: number | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  /** Not open yet; students join a notify-me waitlist instead of purchasing. */
  is_coming_soon?: boolean;
  /** Lesson count shown on the card while the course has no real lessons. */
  coming_soon_lessons?: number;
}

export interface AcademyModule {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
}

export interface AcademyLesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  video_path: string | null;
  slides_path: string | null;
  duration_seconds: number | null;
  is_preview: boolean;
  sort_order: number;
}

export interface CourseWithContent extends AcademyCourse {
  modules: (AcademyModule & { lessons: AcademyLesson[] })[];
  lessonCount: number;
}

/** All courses, admin view (published + drafts), ordered. */
export async function listCourses(): Promise<(AcademyCourse & { lessonCount: number })[]> {
  const admin = createAdminClient();
  const { data: courses } = await admin.from("academy_courses").select("*").order("sort_order").order("created_at");
  const { data: counts } = await admin.from("academy_lessons").select("course_id");
  const byCourse: Record<string, number> = {};
  (counts as { course_id: string }[] | null)?.forEach((r) => { byCourse[r.course_id] = (byCourse[r.course_id] || 0) + 1; });
  // Free courses always list first (price 0), then by sort_order / created_at as fetched.
  const ordered = [...((courses as AcademyCourse[]) || [])].sort((a, b) => {
    const aFree = (a.price || 0) === 0 ? 0 : 1;
    const bFree = (b.price || 0) === 0 ? 0 : 1;
    return aFree - bFree;
  });
  return ordered.map((c) => ({ ...c, lessonCount: byCourse[c.id] || 0 }));
}

/** Published courses for the public catalog. */
export async function listPublishedCourses(): Promise<(AcademyCourse & { lessonCount: number })[]> {
  return (await listCourses()).filter((c) => c.is_published);
}

export interface AcademyReview {
  id: string;
  course_id: string;
  author_name: string;
  rating: number;
  body: string;
  sort_order: number;
  created_at: string;
}

/** All reviews, admin view. */
export async function listAllReviews(): Promise<AcademyReview[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("academy_reviews").select("*").order("sort_order").order("created_at", { ascending: false });
  return (data as AcademyReview[]) || [];
}

/** Reviews for one course. */
export async function listCourseReviews(courseId: string): Promise<AcademyReview[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("academy_reviews").select("*").eq("course_id", courseId).order("sort_order").order("created_at", { ascending: false });
  return (data as AcademyReview[]) || [];
}

/** Average rating + count per course id, for the catalog cards. */
export async function courseRatings(): Promise<Record<string, { avg: number; count: number }>> {
  const admin = createAdminClient();
  const { data } = await admin.from("academy_reviews").select("course_id, rating");
  const acc: Record<string, { total: number; count: number }> = {};
  (data as { course_id: string; rating: number }[] | null)?.forEach((r) => {
    const a = (acc[r.course_id] ||= { total: 0, count: 0 });
    a.total += r.rating || 0; a.count += 1;
  });
  const out: Record<string, { avg: number; count: number }> = {};
  for (const [id, a] of Object.entries(acc)) out[id] = { avg: a.count ? a.total / a.count : 0, count: a.count };
  return out;
}

/** One course with its modules + lessons in order. */
export async function getCourseWithContent(courseIdOrSlug: string): Promise<CourseWithContent | null> {
  const admin = createAdminClient();
  const col = /^[0-9a-f-]{36}$/i.test(courseIdOrSlug) ? "id" : "slug";
  const { data: course } = await admin.from("academy_courses").select("*").eq(col, courseIdOrSlug).maybeSingle();
  if (!course) return null;
  const c = course as AcademyCourse;
  const { data: mods } = await admin.from("academy_modules").select("*").eq("course_id", c.id).order("sort_order");
  const { data: lessons } = await admin.from("academy_lessons").select("*").eq("course_id", c.id).order("sort_order");
  const modules = ((mods as AcademyModule[]) || []).map((m) => ({
    ...m,
    lessons: ((lessons as AcademyLesson[]) || []).filter((l) => l.module_id === m.id),
  }));
  return { ...c, modules, lessonCount: (lessons as AcademyLesson[] | null)?.length || 0 };
}

/** True when a student is enrolled in a course. */
export async function isEnrolled(studentId: string, courseId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from("academy_enrollments").select("id").eq("student_id", studentId).eq("course_id", courseId).maybeSingle();
  return !!data;
}
