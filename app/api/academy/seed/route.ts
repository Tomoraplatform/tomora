import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Temporary, token-gated maintenance endpoint: one-time dash sweep over
 * existing users' stored site content (same copy rules applied to the code).
 * Guarded by ACADEMY_SEED_TOKEN; returns 404 without it. Remove after use.
 */
function authorized(req: NextRequest): boolean {
  const t = process.env.ACADEMY_SEED_TOKEN;
  return !!t && req.headers.get("x-seed-token") === t;
}

function cleanString(s: string): string {
  if (s === "—" || /^https?:\/\//.test(s)) return s;
  let out = s;
  out = out.replace(/\s+—\s+(?=[A-Z])/g, ". ");
  out = out.replace(/\s+—\s+/g, ", ");
  out = out.replace(/\s+—\s*$/g, ",");
  out = out.replace(/^\s*—\s+/g, "");
  out = out.replace(/—/g, ", ");
  out = out.replace(/(\w|\d|:)\s*–\s*(?=\w|\d)/g, "$1 to ");
  out = out.replace(/–/g, " to ");
  out = out.replace(/(\d{4}) - (\d{4}|Now)/g, "$1 to $2");
  return out;
}

function deepClean(v: unknown): unknown {
  if (typeof v === "string") return cleanString(v);
  if (Array.isArray(v)) return v.map(deepClean);
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) o[k] = deepClean(val);
    return o;
  }
  return v;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const body = await req.json();
    const admin = createAdminClient();

    if (body.action === "dash-sweep") {
      let sitesChanged = 0, productsChanged = 0;

      const { data: sites, error: sErr } = await admin.from("sites").select("id, site_data").limit(2000);
      if (sErr) return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });
      for (const site of sites || []) {
        const before = JSON.stringify(site.site_data ?? {});
        const cleaned = deepClean(site.site_data ?? {});
        if (JSON.stringify(cleaned) !== before) {
          const { error } = await admin.from("sites").update({ site_data: cleaned }).eq("id", site.id);
          if (error) return NextResponse.json({ ok: false, error: `site ${site.id}: ${error.message}` }, { status: 500 });
          sitesChanged++;
        }
      }

      const { data: products, error: pErr } = await admin.from("products").select("id, name, description").limit(5000);
      if (pErr) return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
      for (const p of products || []) {
        const name = cleanString(p.name || "");
        const description = p.description ? cleanString(p.description) : p.description;
        if (name !== p.name || description !== p.description) {
          const { error } = await admin.from("products").update({ name, description }).eq("id", p.id);
          if (error) return NextResponse.json({ ok: false, error: `product ${p.id}: ${error.message}` }, { status: 500 });
          productsChanged++;
        }
      }

      return NextResponse.json({
        ok: true,
        sitesScanned: sites?.length || 0, sitesChanged,
        productsScanned: products?.length || 0, productsChanged,
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
