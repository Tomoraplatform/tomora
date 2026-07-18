import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { TOMIVO_PLANS, type TomivoPlanId } from "@/lib/tomivo/constants";

/**
 * Settles a Tomora AI Designs subscription payment (`tomdsn_*` reference):
 * verifies the charge with Paystack, then extends the student's access to the
 * end of the paid period. Idempotent by reference, so the callback and the
 * webhook can both call it safely.
 */
export async function settleTomivoPayment(reference: string): Promise<{ ok: boolean; error?: string }> {
  if (!reference?.startsWith("tomdsn_")) return { ok: false, error: "Invalid reference." };
  const v = await verifyTransaction(reference);
  if (!v.success) return { ok: false, error: "Payment not confirmed yet." };

  const meta = v.metadata || {};
  const studentId = meta.studentId as string | undefined;
  const planId = (meta.plan as TomivoPlanId) || "monthly";
  if (!studentId) return { ok: false, error: "Missing subscriber details." };

  const admin = createAdminClient();

  // Already settled this exact reference? Do nothing (idempotent).
  const { data: existing } = await admin.from("tomivo_subscriptions")
    .select("id, current_period_end, paystack_reference").eq("student_id", studentId).maybeSingle();
  if (existing?.paystack_reference === reference) return { ok: true };

  const plan = TOMIVO_PLANS[planId] || TOMIVO_PLANS.monthly;
  // Extend from the later of now / current end, so renewals stack.
  const base = existing && new Date(existing.current_period_end) > new Date()
    ? new Date(existing.current_period_end) : new Date();
  const end = new Date(base.getTime() + plan.periodDays * 86400000);

  const payload = {
    student_id: studentId, plan: planId, status: "active",
    current_period_end: end.toISOString(), paystack_reference: reference,
  };
  const { error } = existing
    ? await admin.from("tomivo_subscriptions").update(payload).eq("id", existing.id)
    : await admin.from("tomivo_subscriptions").insert(payload);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
