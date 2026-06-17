import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

/** Update a module or lesson's editable fields. */
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

    if (body.type === "module") {
      const { id, title, description } = body;
      const { error } = await supabase
        .from("modules")
        .update({ title, description })
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else if (body.type === "lesson") {
      const { id, title, description, video_embed_url, pdf_view_url } = body;
      const { error } = await supabase
        .from("lessons")
        .update({
          title,
          description,
          video_embed_url: video_embed_url || null,
          pdf_view_url: pdf_view_url || null,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      return NextResponse.json(
        { ok: false, message: "Unknown content type." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[update-content]", err);
    return NextResponse.json(
      { ok: false, message: "Could not save changes." },
      { status: 500 },
    );
  }
}
