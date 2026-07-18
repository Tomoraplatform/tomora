import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Temporary, token-gated seeding endpoint for the initial design library.
 * Guarded by TOMIVO_SEED_TOKEN; returns 404 without it. Remove after use.
 */
function authorized(req: NextRequest): boolean {
  const t = process.env.TOMIVO_SEED_TOKEN;
  return !!t && req.headers.get("x-seed-token") === t;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const body = await req.json();
    const admin = createAdminClient();

    if (body.action === "status") {
      const { count } = await admin.from("tomivo_designs").select("id", { count: "exact", head: true });
      return NextResponse.json({ ok: true, count: count ?? 0 });
    }

    if (body.action === "bulk-create") {
      const rows = (body.designs as any[]).map((d, i) => ({
        title: d.title, slug: d.slug, description: d.description || "", category: d.category,
        tags: d.tags || "", prompt_text: d.promptText || "", html_code: d.htmlCode || "",
        css_code: d.cssCode || "", preview_html: d.previewHtml || "", thumbnail_color: d.thumbnailColor || "#0a0a0a",
        is_featured: !!d.isFeatured, is_premium: !!d.isPremium, is_published: true, sort_order: i,
      }));
      // Upsert on slug so re-runs are safe.
      const { error } = await admin.from("tomivo_designs").upsert(rows, { onConflict: "slug" });
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, inserted: rows.length });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
