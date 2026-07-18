import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMediaUploadUrl } from "@/lib/academy/media";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Temporary, token-gated maintenance endpoint (replace a lesson's slides).
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

    if (body.action === "update-lesson") {
      const allowed = ["title", "video_path", "slides_path", "is_preview", "sort_order"] as const;
      const patch: Record<string, unknown> = {};
      for (const k of allowed) if (body.patch?.[k] !== undefined) patch[k] = body.patch[k];
      const { error } = await admin.from("academy_lessons").update(patch).eq("id", body.lessonId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
