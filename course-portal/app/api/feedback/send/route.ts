import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, feedbackNotificationEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json(
        { ok: false, message: "Please sign in to submit feedback." },
        { status: 401 },
      );
    }

    const { moduleId, biggestTakeaway, whereStuck, questionForExpert } =
      await req.json();

    if (!moduleId || !biggestTakeaway?.trim()) {
      return NextResponse.json(
        { ok: false, message: "Please share your biggest takeaway." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: student } = await admin
      .from("students")
      .select("id, full_name, email, approved_status")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!student || !student.approved_status) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 403 },
      );
    }

    const { data: mod } = await admin
      .from("modules")
      .select("id, title, module_order")
      .eq("id", moduleId)
      .maybeSingle();
    if (!mod) {
      return NextResponse.json(
        { ok: false, message: "Module not found." },
        { status: 404 },
      );
    }

    // One feedback per module per student.
    const { data: existing } = await admin
      .from("module_feedback")
      .select("id")
      .eq("student_id", student.id)
      .eq("module_id", moduleId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          alreadySubmitted: true,
          message: "You've already submitted feedback for this module.",
        },
        { status: 200 },
      );
    }

    const { error: insErr } = await admin.from("module_feedback").insert({
      student_id: student.id,
      module_id: moduleId,
      biggest_takeaway: biggestTakeaway.trim(),
      where_stuck: whereStuck?.trim() || null,
      question_for_expert: questionForExpert?.trim() || null,
    });
    if (insErr) throw new Error(insErr.message);

    // Notify the expert.
    const settings = await getSettings();
    const tpl = feedbackNotificationEmail({
      studentName: student.full_name,
      studentEmail: student.email,
      moduleNumber: mod.module_order,
      moduleTitle: mod.title,
      biggestTakeaway: biggestTakeaway.trim(),
      whereStuck: whereStuck?.trim() || "",
      questionForExpert: questionForExpert?.trim() || "",
      submittedAt: formatDate(new Date()),
    });
    await sendEmail({
      to: settings.feedbackEmail,
      subject: tpl.subject,
      html: tpl.html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback/send]", err);
    return NextResponse.json(
      { ok: false, message: "Feedback submission failed. Please try again." },
      { status: 500 },
    );
  }
}
