import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { NEW_DOMAIN_AMOUNT, VAT_PERCENT } from "@/lib/constants";
import { creditPlatform, recordTransaction } from "@/lib/creator/money";

/**
 * Settles a creator's custom-domain purchase (`crdom_*`): records the request
 * for an admin to register, then credits Tomora's wallet and the ledger.
 * Idempotent by reference.
 */
export async function settleCreatorDomain(reference: string): Promise<{ ok: boolean; error?: string; domain?: string }> {
  if (!reference?.startsWith("crdom_")) return { ok: false, error: "Invalid reference." };
  const v = await verifyTransaction(reference);
  if (!v.success) return { ok: false, error: "Payment not confirmed yet." };

  const meta = v.metadata || {};
  const creatorId = meta.creatorId as string | undefined;
  const domain = (meta.domain as string | undefined)?.toLowerCase();
  if (!creatorId || !domain) return { ok: false, error: "Missing purchase details." };

  const admin = createAdminClient();

  // Already recorded? Then this reference was settled before.
  const { data: existing } = await admin.from("creator_domain_requests")
    .select("id").eq("reference", reference).maybeSingle();
  if (existing) return { ok: true, domain };

  const { error } = await admin.from("creator_domain_requests").insert({
    creator_id: creatorId, domain, amount: NEW_DOMAIN_AMOUNT, reference, status: "paid",
  });
  if (error) return { ok: false, error: error.message };

  const vat = Math.round((NEW_DOMAIN_AMOUNT * VAT_PERCENT) / 100);
  await Promise.all([
    creditPlatform({ source: "domain", amount: NEW_DOMAIN_AMOUNT, reference, description: `Creator domain: ${domain}` }),
    creditPlatform({ source: "vat", amount: vat, reference, isVat: true, description: `VAT on domain ${domain}` }),
    recordTransaction({
      kind: "domain", reference, grossAmount: NEW_DOMAIN_AMOUNT + vat,
      platformAmount: NEW_DOMAIN_AMOUNT, vatAmount: vat, creatorId,
      description: `Creator domain: ${domain}`,
    }),
  ]);

  return { ok: true, domain };
}
