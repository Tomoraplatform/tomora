import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json(
        { ok: false, message: "Please sign in." },
        { status: 401 },
      );
    }

    const { lessonId, completed = true } = await req.json();
    if (!lessonId) {
      return NextResponse.json(
        { ok: false, message: "Missing lesson." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: student } = await admin
      .from("students")
      .select("id, approved_status")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!student || !student.approved_status) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized course access." },
        { status: 403 },
      );
    }

    const { error } = await admin.from("lesson_progress").upsert(
      {
        student_id: student.id,
        lesson_id: lessonId,
        completed: !!completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "student_id,lesson_id" },
    );
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, completed: !!completed });
  } catch (err) {
    console.error("[complete-lesson]", err);
    return NextResponse.json(
      { ok: false, message: "We couldn't save your progress. Please try again." },
      { status: 500 },
    );
  }
}
