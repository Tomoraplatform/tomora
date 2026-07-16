import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Temporary, token-gated maintenance endpoint (course field updates only).
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

    if (body.action === "update-course") {
      const allowed = ["title", "slug", "short_description", "price", "is_published", "thumbnail_url"] as const;
      const patch: Record<string, unknown> = {};
      for (const k of allowed) if (body.patch?.[k] !== undefined) patch[k] = body.patch[k];
      const { data, error } = await admin.from("academy_courses")
        .update(patch).eq("id", body.id)
        .select("id, title, slug, price, is_published").single();
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, course: data });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
