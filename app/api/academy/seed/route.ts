import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMediaUploadUrl, createThumbnailUploadUrl } from "@/lib/academy/media";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Temporary, token-gated maintenance endpoint (attach slides + refresh
 * thumbnails). Guarded by ACADEMY_SEED_TOKEN; returns 404 without it.
 * Remove after use.
 */
function authorized(req: NextRequest): boolean {
  const t = process.env.ACADEMY_SEED_TOKEN;
  return !!t && req.headers.get("x-seed-token") === t;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const body = await req.json();
    const admin = createAdminClient();

    if (body.action === "upload-url") {
      const { path, token } = await createMediaUploadUrl(body.kind, body.ext);
      return NextResponse.json({ ok: true, path, token });
    }

    if (body.action === "thumb-url") {
      const { path, token, publicUrl } = await createThumbnailUploadUrl(body.ext);
      return NextResponse.json({ ok: true, path, token, publicUrl });
    }

    if (body.action === "update-course") {
      const allowed = ["title", "slug", "short_description", "price", "is_published", "thumbnail_url"] as const;
      const patch: Record<string, unknown> = {};
      for (const k of allowed) if (body.patch?.[k] !== undefined) patch[k] = body.patch[k];
      const { data, error } = await admin.from("academy_courses").update(patch).eq("id", body.id).select("id, title").single();
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, course: data });
    }

    // Attach slides to the first lesson of a course (single-lesson courses).
    if (body.action === "set-lesson-slides") {
      const { data: lessons, error: lErr } = await admin
        .from("academy_lessons").select("id, title").eq("course_id", body.courseId).order("sort_order").limit(1);
      if (lErr) return NextResponse.json({ ok: false, error: lErr.message }, { status: 400 });
      const lesson = lessons?.[0];
      if (!lesson) return NextResponse.json({ ok: false, error: "No lesson found." }, { status: 400 });
      const { error } = await admin.from("academy_lessons").update({ slides_path: body.slidesPath }).eq("id", lesson.id);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, lessonId: lesson.id, lessonTitle: lesson.title });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
