import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { groupModules, flattenLessons } from "@/lib/course";
import { getSettings } from "@/lib/settings";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import type { Lesson, Module, PaymentTransaction, Student } from "@/lib/types";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const db = createAdminClient();

  const [
    { data: students },
    { data: modules },
    { data: lessons },
    { data: progress },
    { data: feedback },
    { data: transactions },
  ] = await Promise.all([
    db.from("students").select("*").order("created_at", { ascending: false }),
    db.from("modules").select("*").order("module_order"),
    db.from("lessons").select("*").order("lesson_order"),
    db.from("lesson_progress").select("student_id, lesson_id, completed"),
    db
      .from("module_feedback")
      .select(
        "id, created_at, biggest_takeaway, where_stuck, question_for_expert, student_id, module_id",
      )
      .order("created_at", { ascending: false }),
    db
      .from("payment_transactions")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const grouped = groupModules(
    (modules as Module[]) || [],
    (lessons as Lesson[]) || [],
  );
  const totalLessons = flattenLessons(grouped).length;

  // completed count per student
  const completedByStudent: Record<string, number> = {};
  for (const p of progress || []) {
    if (p.completed) {
      completedByStudent[p.student_id] =
        (completedByStudent[p.student_id] || 0) + 1;
    }
  }

  // resolve feedback student + module labels
  const studentMap = new Map(
    ((students as Student[]) || []).map((s) => [s.id, s]),
  );
  const moduleMap = new Map(((modules as Module[]) || []).map((m) => [m.id, m]));
  const feedbackRows = (feedback || []).map((f) => ({
    id: f.id,
    createdAt: f.created_at,
    studentName: studentMap.get(f.student_id)?.full_name || "Unknown",
    studentEmail: studentMap.get(f.student_id)?.email || "",
    moduleTitle: moduleMap.get(f.module_id)?.title || "Module",
    moduleOrder: moduleMap.get(f.module_id)?.module_order ?? 0,
    biggestTakeaway: f.biggest_takeaway,
    whereStuck: f.where_stuck,
    questionForExpert: f.question_for_expert,
  }));

  const settings = await getSettings();

  return (
    <AdminDashboard
      adminEmail={admin}
      students={(students as Student[]) || []}
      completedByStudent={completedByStudent}
      totalLessons={totalLessons}
      modules={grouped}
      feedback={feedbackRows}
      transactions={(transactions as PaymentTransaction[]) || []}
      settings={settings}
    />
  );
}
