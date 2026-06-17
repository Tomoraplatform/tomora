import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

/** Create or delete a module. */
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
      const title = (body.title || "").trim() || "Untitled module";
      // Next order = max(module_order) + 1
      const { data: last } = await supabase
        .from("modules")
        .select("module_order")
        .order("module_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (last?.module_order ?? -1) + 1;

      const { data, error } = await supabase
        .from("modules")
        .insert({
          title,
          description: body.description?.trim() || null,
          module_order: nextOrder,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, module: data });
    }

    if (body.action === "delete") {
      if (!body.id) {
        return NextResponse.json(
          { ok: false, message: "Missing module id." },
          { status: 400 },
        );
      }
      // Lessons cascade-delete via FK.
      const { error } = await supabase.from("modules").delete().eq("id", body.id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, message: "Unknown action." },
      { status: 400 },
    );
  } catch (err) {
    console.error("[manage-module]", err);
    return NextResponse.json(
      { ok: false, message: "Could not update module." },
      { status: 500 },
    );
  }
}
