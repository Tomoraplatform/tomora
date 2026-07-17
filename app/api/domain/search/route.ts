import { NextResponse, type NextRequest } from "next/server";
import { NEW_DOMAIN_AMOUNT, NEW_DOMAIN_TLDS } from "@/lib/constants";

/**
 * Lightweight domain availability check for the assisted purchase flow.
 * Uses Google DNS-over-HTTPS to see whether a name already has NS records.
 * This is a heuristic, an admin confirms availability at registration time.
 */
async function isRegistered(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`, {
      headers: { accept: "application/dns-json" },
      // Don't cache, availability changes.
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    // status 3 = NXDOMAIN (not registered). Any NS answer = registered.
    if (data.Status === 3) return false;
    return Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  // Strip protocol / any TLD the user typed; keep the bare label.
  const label = raw.replace(/^https?:\/\//, "").split(/[./]/)[0].replace(/[^a-z0-9-]/g, "");
  if (!label || label.length < 2) {
    return NextResponse.json({ error: "Enter at least 2 characters." }, { status: 400 });
  }

  const results = await Promise.all(
    NEW_DOMAIN_TLDS.map(async (tld) => {
      const domain = `${label}.${tld}`;
      const registered = await isRegistered(domain);
      return { domain, available: !registered, amount: NEW_DOMAIN_AMOUNT };
    })
  );

  return NextResponse.json({ label, results });
}
