import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Temporary, token-gated bulk import for the first resources. Delete after use. */
export async function POST(request: NextRequest) {
  const token = process.env.RESOURCE_SEED_TOKEN;
  if (!token || request.headers.get("x-seed-token") !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const body = await request.json();

  if (body?.action === "status") {
    const { data, error } = await admin
      .from("resources")
      .select("slug, title, category, is_paid, price, is_published")
      .order("sort_order");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: data?.length || 0, resources: data });
  }

  const rows = Array.isArray(body?.resources) ? body.resources : [];
  if (!rows.length) return NextResponse.json({ error: "No resources sent." }, { status: 400 });

  const results: { slug: string; ok: boolean; error?: string }[] = [];
  for (const row of rows) {
    const { data: existing } = await admin
      .from("resources")
      .select("id")
      .eq("slug", row.slug)
      .maybeSingle();
    const { error } = existing
      ? await admin.from("resources").update(row).eq("id", existing.id)
      : await admin.from("resources").insert(row);
    results.push({ slug: row.slug, ok: !error, error: error?.message });
  }

  return NextResponse.json({ ok: true, results });
}
