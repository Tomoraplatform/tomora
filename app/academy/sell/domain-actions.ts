"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCreatorByStudent } from "@/lib/creator/db";
import { initTransaction } from "@/lib/paystack";
import { NEW_DOMAIN_AMOUNT, NEW_DOMAIN_TLDS, APP_DOMAIN, withVat } from "@/lib/constants";

/**
 * Starts checkout for a custom domain on a creator's sales pages. Same
 * assisted-purchase price as site domains (fee + 7.5% VAT); an admin
 * registers it and connects it once paid.
 */
export async function buyCreatorDomain(domain: string): Promise<{ ok: boolean; error?: string; url?: string }> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please sign in first." };
  const creator = await getCreatorByStudent(student.id);
  if (!creator) return { ok: false, error: "Set up your creator profile first." };

  const clean = (domain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const okTld = NEW_DOMAIN_TLDS.some((t) => clean.endsWith(`.${t}`));
  if (!okTld || !/^[a-z0-9-]+\.[a-z.]+$/.test(clean)) {
    return { ok: false, error: "That domain isn't available for purchase here." };
  }

  // Don't sell a name that's already requested or connected anywhere.
  const admin = createAdminClient();
  const [{ data: takenByCreator }, { data: takenBySite }] = await Promise.all([
    admin.from("creator_domain_requests").select("id").eq("domain", clean).neq("status", "cancelled").maybeSingle(),
    admin.from("domain_requests").select("id").eq("domain", clean).neq("status", "cancelled").maybeSingle(),
  ]);
  if (takenByCreator || takenBySite) return { ok: false, error: "That domain has already been requested." };

  const origin = headers().get("origin") || `https://${APP_DOMAIN}`;
  const reference = `crdom_${creator.id.slice(0, 8)}_${Date.now()}`;
  try {
    const data = await initTransaction({
      email: student.email,
      amountNaira: withVat(NEW_DOMAIN_AMOUNT),
      reference,
      callbackUrl: `${origin}/api/creator/domain-callback`,
      metadata: {
        purpose: "creator_domain",
        creatorId: creator.id, studentId: student.id, domain: clean,
        custom_fields: [{ display_name: "Domain", variable_name: "domain", value: clean }],
      },
    });
    return { ok: true, url: data.authorization_url };
  } catch (e: any) {
    return { ok: false, error: e.message || "Could not start payment." };
  }
}

/** Creator's domain requests, for their portal. */
export async function listMyDomainRequests(): Promise<{
  ok: boolean; requests?: { id: string; domain: string; status: string; createdAt: string }[]; customDomain?: string | null;
}> {
  const student = await currentStudent();
  if (!student) return { ok: false };
  const creator = await getCreatorByStudent(student.id);
  if (!creator) return { ok: false };

  const admin = createAdminClient();
  const { data } = await admin.from("creator_domain_requests")
    .select("id, domain, status, created_at").eq("creator_id", creator.id).order("created_at", { ascending: false });
  return {
    ok: true,
    customDomain: creator.custom_domain,
    requests: ((data as any[]) || []).map((r) => ({ id: r.id, domain: r.domain, status: r.status, createdAt: r.created_at })),
  };
}

/** Refreshes the creator portal after a domain purchase returns. */
export async function refreshSellPage(): Promise<void> {
  revalidatePath("/academy/sell");
}
