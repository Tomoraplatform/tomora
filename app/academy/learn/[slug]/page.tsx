import { notFound, redirect } from "next/navigation";
import { currentStudent } from "@/lib/academy/auth";
import { getCourseWithContent, isEnrolled } from "@/lib/academy/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { CoursePlayer } from "@/components/academy/course-player";

export const dynamic = "force-dynamic";

interface Params { params: { slug: string } }

export async function generateMetadata({ params }: Params) {
  const course = await getCourseWithContent(decodeURIComponent(params.slug));
  return { robots: { index: false, follow: false }, title: course ? `${course.title} | Tomora Academy` : "Course | Tomora Academy" };
}

export default async function LearnPage({ params }: Params) {
  const student = await currentStudent();
  if (!student) redirect(`/academy/join`);

  const course = await getCourseWithContent(decodeURIComponent(params.slug));
  if (!course || !course.is_published) notFound();
  if (!(await isEnrolled(student.id, course.id))) redirect("/academy/portal");

  const admin = createAdminClient();
  const { data: progress } = await admin
    .from("academy_progress").select("lesson_id").eq("student_id", student.id);
  const completed = (progress as { lesson_id: string }[] | null)?.map((r) => r.lesson_id) || [];

  return <CoursePlayer course={course} completedLessonIds={completed} studentName={student.name} studentEmail={student.email} />;
}
