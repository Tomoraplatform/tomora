import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { redeemCoupon } from "@/lib/academy/coupons";
import { creditPlatform, recordTransaction } from "@/lib/creator/money";

/**
 * Settles a paid academy purchase (`acad_*` reference): verifies the charge
 * with Paystack, then enrolls the student. Idempotent, the unique
 * (student_id, course_id) constraint makes double-settles harmless. Called
 * from the payment callback and the Paystack webhook, so a buyer who closes
 * the tab after paying still gets access.
 */
export async function settleAcademyPayment(reference: string): Promise<{ ok: boolean; courseId?: string; error?: string }> {
  if (!reference?.startsWith("acad_")) return { ok: false, error: "Invalid reference." };
  const v = await verifyTransaction(reference);
  if (!v.success) return { ok: false, error: "Payment not confirmed yet." };

  const meta = v.metadata || {};
  const studentId = meta.studentId as string | undefined;
  const courseId = meta.courseId as string | undefined;
  const couponId = meta.couponId as string | undefined;
  if (!studentId || !courseId) return { ok: false, error: "Missing purchase details." };

  const admin = createAdminClient();
  const { error } = await admin.from("academy_enrollments").insert({
    student_id: studentId,
    course_id: courseId,
    source: "purchase",
    paystack_reference: reference,
  });
  if (error && error.code !== "23505") return { ok: false, error: error.message };
  // Count the coupon redemption only on a fresh enrollment (not a duplicate settle).
  if (couponId && !error) await redeemCoupon(couponId);

  // Tomora's own course: the whole amount is platform revenue.
  if (!error) {
    const paid = Math.max(0, Math.round(Number(v.amountNaira) || 0));
    await Promise.all([
      creditPlatform({ source: "academy_course", amount: paid, reference, description: "Tomora Academy course" }),
      recordTransaction({
        kind: "academy_course", reference, grossAmount: paid, platformAmount: paid,
        studentId, description: "Tomora Academy course",
      }),
    ]);
  }
  return { ok: true, courseId };
}
