import { notFound, redirect } from "next/navigation";
import { getPublicCreatorCourse, isCreatorEnrolled } from "@/lib/creator/db";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";
import { CreatorPlayer } from "@/components/creator/creator-player";

export const metadata = { robots: { index: false, follow: false }, title: "Learning" };
export const dynamic = "force-dynamic";

interface Params { params: { creator: string; course: string } }

export default async function CreatorLearnPage({ params }: Params) {
  if (!(await academyOpen())) return <AcademyClosed />;

  const student = await currentStudent();
  if (!student) redirect(`/c/${params.creator}/${params.course}/checkout`);

  const data = await getPublicCreatorCourse(params.creator, params.course);
  if (!data) notFound();
  const { creator, course } = data;

  if (!(await isCreatorEnrolled(student.id, course.id))) {
    redirect(`/c/${creator.slug}/${course.slug}/checkout`);
  }

  const admin = createAdminClient();
  const { data: progress } = await admin.from("creator_progress").select("lesson_id").eq("student_id", student.id);
  const completed = (progress as { lesson_id: string }[] | null)?.map((r) => r.lesson_id) || [];

  return (
    <CreatorPlayer
      course={course}
      creatorSlug={creator.slug}
      completedLessonIds={completed}
      studentName={student.name}
      authorName={creator.author_name}
    />
  );
}
