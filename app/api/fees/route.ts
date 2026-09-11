import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { feePolicyForOwner } from "@/lib/plan-fees";
import { NO_FEE } from "@/lib/platform-fee";

export const dynamic = "force-dynamic";

/**
 * Public: the transaction fee a site's customers pay, and whether it takes
 * bank transfers. Lets the checkout drawer and the donation form show the
 * processing fee before the customer commits. Display only: the checkout and
 * donation endpoints resolve the fee again themselves and charge that.
 */
export async function GET(request: NextRequest) {
  const siteId = new URL(request.url).searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "Missing site." }, { status: 400 });

  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites").select("user_id, is_demo").eq("id", siteId).maybeSingle();
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });

  // The sandbox moves no money, so it pays no fee and keeps every method.
  if (site.is_demo) return NextResponse.json({ ...NO_FEE, allowBankTransfer: true });

  try {
    const policy = await feePolicyForOwner(site.user_id as string);
    return NextResponse.json({ ...policy.rate, allowBankTransfer: policy.allowBankTransfer });
  } catch {
    return NextResponse.json({ error: "Could not load fees." }, { status: 503 });
  }
}
