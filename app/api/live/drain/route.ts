import { NextResponse, type NextRequest } from "next/server";
import { drainOutbox } from "@/lib/live/conversations";

/**
 * Sends whatever is waiting in the Live outbox.
 *
 * Vercel has no long-running worker, so this stands in for one: Vercel Cron
 * calls it on a schedule, and it is also safe to call by hand. Protected by a
 * shared secret because anything reachable can be called by anyone.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = request.headers.get("authorization") || "";
  const provided = request.nextUrl.searchParams.get("key") || "";
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const allowed = secret && (auth === `Bearer ${secret}` || provided === secret);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await drainOutbox();
  return NextResponse.json({ ok: true, ...result });
}
