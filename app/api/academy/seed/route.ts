import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMediaUploadUrl, createThumbnailUploadUrl } from "@/lib/academy/media";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Temporary, token-gated seeding endpoint used to load a course (media lives
 * locally; Vercel env vars are sensitive so seeding must run server-side).
 * Guarded by ACADEMY_SEED_TOKEN; returns 404 without it. Remove after use.
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

    if (body.action === "create-course") {
      const c = body.course as {
        title: string; slug: string; short_description: string; price: number;
        is_published?: boolean; thumbnail_url?: string;
        modules: { title: string; lessons: { title: string; video_path?: string; slides_path?: string; is_preview?: boolean }[] }[];
      };
      const { data: course, error: cErr } = await admin.from("academy_courses")
        .insert({ title: c.title, slug: c.slug, short_description: c.short_description, price: c.price, thumbnail_url: c.thumbnail_url || null, is_published: !!c.is_published, sort_order: 0 })
        .select("id").single();
      if (cErr || !course) return NextResponse.json({ ok: false, error: cErr?.message }, { status: 400 });

      for (let mi = 0; mi < c.modules.length; mi++) {
        const m = c.modules[mi];
        const { data: mod, error: mErr } = await admin.from("academy_modules")
          .insert({ course_id: course.id, title: m.title, sort_order: mi + 1 })
          .select("id").single();
        if (mErr || !mod) return NextResponse.json({ ok: false, error: mErr?.message }, { status: 400 });
        for (let li = 0; li < m.lessons.length; li++) {
          const l = m.lessons[li];
          const { error: lErr } = await admin.from("academy_lessons").insert({
            module_id: mod.id, course_id: course.id, title: l.title,
            video_path: l.video_path || null, slides_path: l.slides_path || null,
            is_preview: !!l.is_preview, sort_order: li + 1,
          });
          if (lErr) return NextResponse.json({ ok: false, error: lErr.message }, { status: 400 });
        }
      }
      return NextResponse.json({ ok: true, courseId: course.id });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
