import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { splitSale, creditCreator, creditPlatform, recordTransaction } from "@/lib/creator/money";

/**
 * Settles a creator course purchase (`crs_*` reference): verifies the charge,
 * enrolls the student, then splits the money — creator's 95% into their
 * wallet, Tomora's 5% plus the VAT into the platform wallet — and records one
 * row in the unified ledger. Idempotent, so the callback and webhook can both
 * call it safely.
 */
export async function settleCreatorPurchase(reference: string): Promise<{ ok: boolean; error?: string; courseId?: string; creatorSlug?: string; courseSlug?: string }> {
  if (!reference?.startsWith("crs_")) return { ok: false, error: "Invalid reference." };
  const v = await verifyTransaction(reference);
  if (!v.success) return { ok: false, error: "Payment not confirmed yet." };

  const meta = v.metadata || {};
  const studentId = meta.studentId as string | undefined;
  const courseId = meta.courseId as string | undefined;
  const couponId = meta.couponId as string | undefined;
  // Net price (after any coupon, before VAT) as computed at checkout.
  const netPrice = Math.max(0, Math.round(Number(meta.netPrice) || 0));
  if (!studentId || !courseId) return { ok: false, error: "Missing purchase details." };

  const admin = createAdminClient();
  const { data: course } = await admin.from("creator_courses")
    .select("id, slug, title, creator_id, purchases").eq("id", courseId).maybeSingle();
  if (!course) return { ok: false, error: "Course not found." };

  const split = splitSale(netPrice);

  // Enroll. A duplicate means this reference was already settled.
  const { error: enrollErr } = await admin.from("creator_enrollments").insert({
    student_id: studentId, course_id: courseId, source: "purchase",
    paystack_reference: reference, amount_paid: split.gross,
  });
  const alreadySettled = enrollErr?.code === "23505";
  if (enrollErr && !alreadySettled) return { ok: false, error: enrollErr.message };

  const { data: creator } = await admin.from("academy_creators").select("slug").eq("id", course.creator_id).maybeSingle();

  if (!alreadySettled) {
    // Money split. Each insert is guarded by a unique (type, reference) index,
    // so a repeated settle can never double-credit.
    await Promise.all([
      creditCreator({
        creatorId: course.creator_id, courseId,
        amount: split.creatorShare, reference,
        description: `Sale: ${course.title}`,
      }),
      creditPlatform({
        source: "course_fee", amount: split.platformFee, reference,
        description: `5% fee: ${course.title}`,
      }),
      creditPlatform({
        source: "vat", amount: split.vat, reference, isVat: true,
        description: `VAT on ${course.title}`,
      }),
      recordTransaction({
        kind: "creator_course", reference,
        grossAmount: split.gross, platformAmount: split.platformFee,
        payeeAmount: split.creatorShare, vatAmount: split.vat,
        studentId, creatorId: course.creator_id,
        description: course.title,
      }),
    ]);

    await admin.from("creator_courses").update({ purchases: (course.purchases || 0) + 1 }).eq("id", courseId);
    if (couponId) {
      const { data: c } = await admin.from("creator_coupons").select("used_count").eq("id", couponId).maybeSingle();
      if (c) await admin.from("creator_coupons").update({ used_count: (c.used_count || 0) + 1 }).eq("id", couponId);
    }
  }

  return { ok: true, courseId, creatorSlug: creator?.slug, courseSlug: course.slug };
}

/** Validates a creator's coupon for one of their courses. */
export async function validateCreatorCoupon(courseId: string, rawCode: string, price: number): Promise<{
  ok: boolean; error?: string; couponId?: string; discountedPrice?: number; discountLabel?: string;
}> {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code." };
  const admin = createAdminClient();
  const { data: c } = await admin.from("creator_coupons")
    .select("*").eq("course_id", courseId).eq("code", code).maybeSingle();
  if (!c || !c.active) return { ok: false, error: "This coupon code is not valid." };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { ok: false, error: "This coupon has expired." };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { ok: false, error: "This coupon has reached its limit." };

  const value = Math.max(0, c.discount_value || 0);
  const discount = c.discount_type === "fixed" ? value : Math.round((price * value) / 100);
  return {
    ok: true, couponId: c.id,
    discountedPrice: Math.max(0, price - discount),
    discountLabel: c.discount_type === "fixed" ? `₦${value.toLocaleString()} off` : `${value}% off`,
  };
}
