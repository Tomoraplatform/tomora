import { NextResponse, type NextRequest } from "next/server";
import { currentStudent } from "@/lib/academy/auth";
import { isEnrolled } from "@/lib/academy/db";
import { signedPlaybackUrl } from "@/lib/academy/media";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Returns short-lived signed playback URLs for one lesson's media,
 * only for the signed-in student when they're enrolled (or the lesson is a
 * free preview). This is the sole gateway to the private media bucket.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const student = await currentStudent();
  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("academy_lessons")
    .select("id, course_id, is_preview, video_path, slides_path")
    .eq("id", params.id)
    .maybeSingle();
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const allowed = lesson.is_preview || (student ? await isEnrolled(student.id, lesson.course_id) : false);
  if (!allowed) return NextResponse.json({ error: "Not enrolled." }, { status: 403 });

  const [videoUrl, slidesUrl] = await Promise.all([
    lesson.video_path ? signedPlaybackUrl(lesson.video_path) : null,
    lesson.slides_path ? signedPlaybackUrl(lesson.slides_path) : null,
  ]);
  return NextResponse.json(
    { videoUrl, slidesUrl },
    { headers: { "Cache-Control": "no-store" } }
  );
}
