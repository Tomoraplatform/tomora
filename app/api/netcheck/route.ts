import { NextResponse, type NextRequest } from "next/server";

/**
 * The server half of /netcheck.
 *
 * GET tells the page what the edge saw: which Vercel POP answered, which
 * country and city the request appeared to come from, and the visitor's IP.
 * That is what turns "it is slow on MTN" into a row of numbers we can compare
 * between carriers.
 *
 * POST takes the numbers the browser measured and writes them to the runtime
 * log (Vercel dashboard, Logs). Nothing is stored in the database, so this
 * route adds no schema and no new failure mode to anything else.
 */
export const dynamic = "force-dynamic";
export const runtime = "edge";

function clientView(request: NextRequest) {
  const h = request.headers;
  const forwarded = h.get("x-forwarded-for") || "";
  return {
    ip: forwarded.split(",")[0].trim() || null,
    country: h.get("x-vercel-ip-country"),
    region: h.get("x-vercel-ip-country-region"),
    city: h.get("x-vercel-ip-city"),
    // Present on some plans; harmless when missing.
    asn: h.get("x-vercel-ip-asn") || h.get("x-vercel-ip-as-number"),
    pop: h.get("x-vercel-id"),
    ua: h.get("user-agent"),
  };
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { ok: true, at: new Date().toISOString(), edge: clientView(request) },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    /* a report we cannot read is still worth the edge line below */
  }

  console.log(
    "[netcheck]",
    JSON.stringify({ at: new Date().toISOString(), edge: clientView(request), report: body })
  );

  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
