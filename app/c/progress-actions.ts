"use server";

import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCreatorEnrolled } from "@/lib/creator/db";

/** Marks a creator-course lesson complete (or not) for the signed-in student. */
export async function setCreatorLessonComplete(lessonId: string, complete: boolean): Promise<{ ok: boolean; error?: string }> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please sign in first." };

  const admin = createAdminClient();
  const { data: lesson } = await admin.from("creator_lessons").select("id, course_id").eq("id", lessonId).maybeSingle();
  if (!lesson) return { ok: false, error: "Lesson not found." };
  if (!(await isCreatorEnrolled(student.id, lesson.course_id))) return { ok: false, error: "Not enrolled." };

  if (complete) {
    const { error } = await admin.from("creator_progress").insert({ student_id: student.id, lesson_id: lessonId });
    if (error && error.code !== "23505") return { ok: false, error: error.message };
  } else {
    await admin.from("creator_progress").delete().eq("student_id", student.id).eq("lesson_id", lessonId);
  }
  return { ok: true };
}
