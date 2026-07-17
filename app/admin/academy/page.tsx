import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { listCourses, getCourseWithContent } from "@/lib/academy/db";
import { AcademyManager, type CourseRoster } from "@/components/admin/academy-manager";

export const metadata = { robots: { index: false, follow: false },  title: "Academy | Admin | Tomora" };
export const dynamic = "force-dynamic";

export default async function AdminAcademyPage() {
  await requireAdmin();
  const courses = await listCourses();
  const detailed = await Promise.all(courses.map((c) => getCourseWithContent(c.id)));

  // Per-course roster: who has access, how they got it.
  const admin = createAdminClient();
  const [{ data: enrollments }, { data: students }] = await Promise.all([
    admin.from("academy_enrollments").select("id, student_id, course_id, source, created_at"),
    admin.from("academy_students").select("id, name, email"),
  ]);
  const studentById = new Map((students as { id: string; name: string; email: string }[] | null)?.map((s) => [s.id, s]));
  const roster: CourseRoster = {};
  (enrollments as { id: string; student_id: string; course_id: string; source: string; created_at: string }[] | null)?.forEach((e) => {
    const s = studentById.get(e.student_id);
    if (!s) return;
    (roster[e.course_id] ||= []).push({ enrollmentId: e.id, name: s.name, email: s.email, source: e.source, createdAt: e.created_at });
  });

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="text-2xl font-bold text-ink">Academy</h1>
        <p className="mt-1 text-ink/60">
          Create and manage courses, modules and lessons. Manage student access inside each course. {students?.length || 0} registered student{(students?.length || 0) === 1 ? "" : "s"}.
        </p>
        <div className="mt-6">
          <AcademyManager courses={detailed.filter(Boolean) as NonNullable<(typeof detailed)[number]>[]} roster={roster} />
        </div>
      </div>
    </div>
  );
}
