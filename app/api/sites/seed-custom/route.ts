import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Temporary, token-gated helper for standing up a custom-HTML site: creates
 * the site row, hands back a signed upload URL for the HTML file and then
 * attaches it. Delete this route once the site is live.
 */
export async function POST(request: NextRequest) {
  const token = process.env.SITE_SEED_TOKEN;
  if (!token || request.headers.get("x-seed-token") !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const body = await request.json();
  const action = String(body?.action || "");
  const subdomain = String(body?.subdomain || "");

  if (action === "create") {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const owner = list?.users.find((u) => u.email?.toLowerCase() === String(body.ownerEmail).toLowerCase());
    if (!owner) return NextResponse.json({ error: "Owner account not found." }, { status: 400 });

    const { data: existing } = await admin.from("sites").select("id").eq("subdomain", subdomain).maybeSingle();
    const row = {
      user_id: owner.id,
      template_id: "custom-html",
      category: "ecommerce" as const,
      subdomain,
      is_live: true,
      site_data: body.siteData,
    };
    const { data, error } = existing
      ? await admin.from("sites").update(row).eq("id", existing.id).select("id").single()
      : await admin.from("sites").insert(row).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("reserved_handles").insert({ handle: subdomain, kind: "site" });
    return NextResponse.json({ ok: true, siteId: data.id });
  }

  if (action === "sign") {
    const path = `${subdomain}/index.html`;
    const { data, error } = await admin.storage.from("site-html").createSignedUploadUrl(path, { upsert: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: pub } = admin.storage.from("site-html").getPublicUrl(path);
    return NextResponse.json({ ok: true, signedUrl: data.signedUrl, token: data.token, publicUrl: pub.publicUrl });
  }

  if (action === "attach") {
    const { error } = await admin
      .from("sites")
      .update({ custom_html_url: String(body.url) })
      .eq("subdomain", subdomain);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "status") {
    const { data, error } = await admin
      .from("sites")
      .select("id, subdomain, is_live, category, custom_html_url, paystack_subaccount")
      .eq("subdomain", subdomain)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, site: data });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
