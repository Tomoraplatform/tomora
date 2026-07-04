import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Records one visit to a published site. Called by a client beacon on live
 * sites (throttled to once per browser session). Best-effort — never blocks
 * the page and never errors visibly.
 */
export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json().catch(() => ({ siteId: null }));
    if (!siteId || typeof siteId !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const admin = createAdminClient();
    await admin.rpc("increment_site_visit", { p_site_id: siteId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
