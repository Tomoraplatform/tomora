import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

/** Create or delete a lesson within a module. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Admin access denied." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const supabase = createAdminClient();

    if (body.action === "create") {
      if (!body.module_id) {
        return NextResponse.json(
          { ok: false, message: "Missing module." },
          { status: 400 },
        );
      }
      const lessonType =
        body.lesson_type === "worksheet" || body.lesson_type === "welcome"
          ? body.lesson_type
          : "video";

      const { data: last } = await supabase
        .from("lessons")
        .select("lesson_order")
        .eq("module_id", body.module_id)
        .order("lesson_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (last?.lesson_order ?? 0) + 1;

      const { data, error } = await supabase
        .from("lessons")
        .insert({
          module_id: body.module_id,
          title: (body.title || "").trim() || "Untitled lesson",
          description: body.description?.trim() || null,
          lesson_type: lessonType,
          lesson_order: nextOrder,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, lesson: data });
    }

    if (body.action === "delete") {
      if (!body.id) {
        return NextResponse.json(
          { ok: false, message: "Missing lesson id." },
          { status: 400 },
        );
      }
      const { error } = await supabase.from("lessons").delete().eq("id", body.id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, message: "Unknown action." },
      { status: 400 },
    );
  } catch (err) {
    console.error("[manage-lesson]", err);
    return NextResponse.json(
      { ok: false, message: "Could not update lesson." },
      { status: 500 },
    );
  }
}
