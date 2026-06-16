import { NextResponse } from "next/server";
import dns from "dns/promises";
import { createClient } from "@/lib/supabase/server";
import { APP_DOMAIN } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * Checks whether the user's custom domain has the expected CNAME pointing at
 * the Tomora platform target, and updates domain_status accordingly. The
 * client polls this while a domain is pending.
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: site } = await supabase
    .from("sites")
    .select("id, custom_domain, domain_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!site?.custom_domain) {
    return NextResponse.json({ status: "none" });
  }

  const target = `cname.${APP_DOMAIN}`;
  let verified = false;
  try {
    const cnames = await dns.resolveCname(site.custom_domain).catch(() => [] as string[]);
    verified = cnames.some((c) => c.includes(APP_DOMAIN) || c.includes("vercel"));
    if (!verified) {
      // apex domains may use A/ALIAS — accept any resolving record as a soft check
      const a = await dns.resolve4(site.custom_domain).catch(() => [] as string[]);
      verified = a.length > 0 && cnames.some((c) => c.includes(target));
    }
  } catch {
    verified = false;
  }

  const status = verified ? "active" : "verifying";
  await supabase.from("sites").update({ domain_status: status }).eq("id", site.id);
  await supabase.from("domains").update({ status }).eq("site_id", site.id);

  return NextResponse.json({ status, target });
}
