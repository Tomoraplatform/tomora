import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { creditPlatform, recordTransaction } from "@/lib/creator/money";
import { makeAccessToken } from "@/lib/resources/access";
import { sendEmail } from "@/lib/email";
import { formatNaira } from "@/lib/utils";

/**
 * Settles a resource purchase (`res_*` reference): verifies the charge with
 * Paystack, marks the pending row paid and emails the buyer a link that
 * unlocks the resource on any device. Idempotent, so the browser callback and
 * the webhook can both run it.
 */
export async function settleResourcePurchase(
  reference: string
): Promise<{ ok: boolean; email?: string; slug?: string; error?: string }> {
  if (!reference?.startsWith("res_")) return { ok: false, error: "Invalid reference." };

  const admin = createAdminClient();
  const { data: purchase } = await admin
    .from("resource_purchases")
    .select("id, resource_id, email, name, amount, status")
    .eq("reference", reference)
    .maybeSingle();
  if (!purchase) return { ok: false, error: "We could not find that order." };

  const { data: resource } = await admin
    .from("resources")
    .select("id, slug, title, category")
    .eq("id", purchase.resource_id)
    .maybeSingle();

  // Already settled: hand back the same details rather than charging anything.
  if (purchase.status === "paid") {
    return { ok: true, email: purchase.email, slug: resource?.slug };
  }

  const v = await verifyTransaction(reference);
  if (!v.success) return { ok: false, error: "Payment not confirmed yet." };

  const { error } = await admin
    .from("resource_purchases")
    .update({ status: "paid" })
    .eq("id", purchase.id);
  if (error) return { ok: false, error: error.message };

  const paid = Math.max(0, Math.round(Number(v.amountNaira) || purchase.amount));
  const label = `Resource: ${resource?.title || "Tomora resource"}`;
  await Promise.all([
    creditPlatform({ source: "resource", amount: paid, reference, description: label }),
    recordTransaction({
      kind: "resource",
      reference,
      grossAmount: paid,
      platformAmount: paid,
      description: label,
    }),
  ]);

  // Best effort: the unlock link matters, but a mail failure must not undo a
  // settled payment (the browser is unlocked by its cookie either way).
  try {
    await sendUnlockEmail(purchase.email, purchase.name, resource, paid);
  } catch {
    /* non-fatal */
  }

  return { ok: true, email: purchase.email, slug: resource?.slug };
}

async function sendUnlockEmail(
  email: string,
  name: string | null,
  resource: { slug: string; title: string } | null,
  amount: number
): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tomora.com.ng";
  const link = `${base}/resources/unlock?token=${encodeURIComponent(makeAccessToken(email))}`;
  const target = resource ? `${base}/resources/${resource.slug}` : `${base}/resources`;

  await sendEmail({
    to: email,
    subject: `Your Tomora resource is ready: ${resource?.title || "Download"}`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#022245">
        <h2 style="margin:0 0 8px">Thank you${name ? `, ${name}` : ""}</h2>
        <p style="margin:0 0 16px;color:#4a5b6b">
          Your payment of ${formatNaira(amount)} for <strong>${resource?.title || "your resource"}</strong> came through.
          You can copy the prompt, copy the HTML or download the file right away.
        </p>
        <p style="margin:0 0 20px">
          <a href="${target}" style="background:#022245;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">
            Open your resource
          </a>
        </p>
        <p style="margin:0 0 8px;color:#4a5b6b;font-size:14px">
          Changed device or cleared your browser? This link restores everything you have bought:
        </p>
        <p style="margin:0 0 24px;font-size:13px;word-break:break-all">
          <a href="${link}" style="color:#022245">${link}</a>
        </p>
        <p style="margin:0;color:#8194a5;font-size:12px">
          Keep this email. It is your receipt and your access link.
        </p>
      </div>`,
  });
}
