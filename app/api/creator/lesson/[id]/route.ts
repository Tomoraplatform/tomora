import { NextResponse, type NextRequest } from "next/server";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCreatorEnrolled } from "@/lib/creator/db";
import { signedLessonUrl, toEmbedUrl } from "@/lib/creator/media";

export const dynamic = "force-dynamic";

/**
 * Sole gateway to a creator lesson's media. Uploaded files come back as
 * short-lived signed URLs; link lessons come back as an embed URL. Only the
 * enrolled student (or a free preview lesson) gets anything.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data: lesson } = await admin.from("creator_lessons")
    .select("id, course_id, is_preview, lesson_type, media_path, media_url, title, description")
    .eq("id", params.id).maybeSingle();
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const student = await currentStudent();
  const allowed = lesson.is_preview || (student ? await isCreatorEnrolled(student.id, lesson.course_id) : false);
  if (!allowed) return NextResponse.json({ error: "Not enrolled.", locked: true }, { status: 403 });

  const payload: Record<string, unknown> = { type: lesson.lesson_type, title: lesson.title, description: lesson.description };
  if (lesson.lesson_type === "link" && lesson.media_url) {
    payload.embedUrl = toEmbedUrl(lesson.media_url);
    payload.rawUrl = lesson.media_url;
  } else if (lesson.media_path) {
    payload.fileUrl = await signedLessonUrl(lesson.media_path);
  }

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
