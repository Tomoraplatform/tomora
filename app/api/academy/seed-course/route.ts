import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Temporary, token-gated course importer. Delete once the course is seeded. */
export async function POST(request: NextRequest) {
  const token = process.env.ACADEMY_SEED_TOKEN;
  if (!token || request.headers.get("x-seed-token") !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const body = await request.json();
  const action = String(body?.action || "");

  // A signed URL so large media can be PUT straight from the machine that has
  // the files, instead of through this request body.
  if (action === "sign") {
    const path = String(body.path || "");
    const bucket = String(body.bucket || "academy-media");
    const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, signedUrl: data.signedUrl, path });
  }

  if (action === "course") {
    const c = body.course;
    const { data: existing } = await admin
      .from("academy_courses").select("id").eq("slug", c.slug).maybeSingle();
    const row = {
      title: c.title, slug: c.slug, short_description: c.short_description,
      thumbnail_url: c.thumbnail_url, price: c.price, compare_price: c.compare_price,
      is_published: c.is_published, sort_order: c.sort_order,
      is_coming_soon: false, coming_soon_lessons: 0,
    };
    const { data, error } = existing
      ? await admin.from("academy_courses").update(row).eq("id", existing.id).select("id").single()
      : await admin.from("academy_courses").insert(row).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, courseId: data.id });
  }

  if (action === "structure") {
    const courseId = String(body.courseId);
    // Rebuild cleanly so re-running cannot duplicate modules or lessons.
    await admin.from("academy_modules").delete().eq("course_id", courseId);

    const out: { module: string; lessons: number }[] = [];
    for (const m of body.modules as { title: string; lessons: Record<string, unknown>[] }[]) {
      const { data: mod, error: mErr } = await admin
        .from("academy_modules")
        .insert({ course_id: courseId, title: m.title, sort_order: out.length })
        .select("id").single();
      if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

      const rows = m.lessons.map((l, i) => ({ ...l, module_id: mod.id, course_id: courseId, sort_order: i }));
      const { error: lErr } = await admin.from("academy_lessons").insert(rows);
      if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });
      out.push({ module: m.title, lessons: rows.length });
    }
    return NextResponse.json({ ok: true, modules: out });
  }

  if (action === "status") {
    // Surface the error: ignoring it makes a failing select look like "not
    // found", which hides a missing column behind an empty result.
    const { data: course, error: cErr } = await admin
      .from("academy_courses").select("id, title, slug, price, compare_price, is_published")
      .eq("slug", String(body.slug || "")).maybeSingle();
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    if (!course) return NextResponse.json({ ok: true, course: null, note: "no row with that slug" });
    const { data: lessons } = await admin
      .from("academy_lessons")
      .select("title, video_path, slides_path, sort_order, academy_modules(title)")
      .eq("course_id", course.id).order("sort_order");
    return NextResponse.json({ ok: true, course, lessons });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
