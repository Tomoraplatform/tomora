import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { groupModules, flattenLessons } from "@/lib/course";
import type { ModuleWithLessons, Student } from "@/lib/types";

export interface StudentContext {
  student: Student;
  modules: ModuleWithLessons[];
  allLessonsCount: number;
  completedIds: Set<string>;
  feedbackModuleIds: Set<string>;
}

/**
 * Loads the authenticated, approved student's full course context.
 * Redirects to /login if not authenticated, or to /login with a soft message
 * if the account is not an approved student.
 */
export async function getStudentContext(): Promise<StudentContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const admin = createAdminClient();

  const { data: student } = await admin
    .from("students")
    .select("*")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!student || !student.approved_status) {
    redirect("/login?error=not_approved");
  }

  const [{ data: modules }, { data: lessons }, { data: progress }, { data: feedback }] =
    await Promise.all([
      admin.from("modules").select("*").order("module_order"),
      admin.from("lessons").select("*").order("lesson_order"),
      admin
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("student_id", student.id),
      admin
        .from("module_feedback")
        .select("module_id")
        .eq("student_id", student.id),
    ]);

  const grouped = groupModules(modules || [], lessons || []);
  const completedIds = new Set(
    (progress || []).filter((p) => p.completed).map((p) => p.lesson_id),
  );
  const feedbackModuleIds = new Set((feedback || []).map((f) => f.module_id));

  return {
    student: student as Student,
    modules: grouped,
    allLessonsCount: flattenLessons(grouped).length,
    completedIds,
    feedbackModuleIds,
  };
}
