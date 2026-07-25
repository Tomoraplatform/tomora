"use server";

import { revalidatePath } from "next/cache";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCreatorByStudent } from "@/lib/creator/db";
import { creatorBalance, MIN_WITHDRAWAL } from "@/lib/creator/money";

type R = { ok: boolean; error?: string };

/**
 * Requests a withdrawal from the creator's wallet. Records a pending
 * withdrawal (which holds the funds) plus a payout request an admin marks
 * paid after sending the transfer.
 */
export async function requestCreatorPayout(amount: number): Promise<R> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please sign in first." };
  const creator = await getCreatorByStudent(student.id);
  if (!creator) return { ok: false, error: "Creator profile not found." };
  if (!creator.account_number || !creator.bank_code) {
    return { ok: false, error: "Add your payout bank account first." };
  }

  const value = Math.round(amount || 0);
  if (value < MIN_WITHDRAWAL) return { ok: false, error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}.` };

  const { balance } = await creatorBalance(creator.id);
  if (value > balance) return { ok: false, error: "That's more than your available balance." };

  const admin = createAdminClient();
  const reference = `cpo_${creator.id.slice(0, 8)}_${Date.now()}`;
  const { error: txErr } = await admin.from("creator_wallet_transactions").insert({
    creator_id: creator.id, type: "withdrawal", source: "payout",
    amount: value, status: "pending", reference,
    description: `Withdrawal to ${creator.bank_name || "bank"} ${creator.account_number}`,
  });
  if (txErr) return { ok: false, error: txErr.message };

  const { error } = await admin.from("creator_payouts").insert({
    creator_id: creator.id, amount: value, status: "pending", note: reference,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/academy/sell");
  return { ok: true };
}

/* ---------------- creator coupons ---------------- */

export async function createCreatorCoupon(input: {
  courseId: string; code: string; discountType: "percent" | "fixed"; discountValue: number;
  maxUses?: number | null; expiresAt?: string | null;
}): Promise<R> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please sign in first." };
  const creator = await getCreatorByStudent(student.id);
  if (!creator) return { ok: false, error: "Creator profile not found." };

  const admin = createAdminClient();
  const { data: course } = await admin.from("creator_courses").select("creator_id").eq("id", input.courseId).maybeSingle();
  if (course?.creator_id !== creator.id) return { ok: false, error: "Course not found." };

  const code = (input.code || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return { ok: false, error: "Enter a coupon code." };
  const value = Math.max(0, Math.round(input.discountValue || 0));
  if (input.discountType === "percent" && value > 100) return { ok: false, error: "Percent discount can't exceed 100." };

  const { error } = await admin.from("creator_coupons").insert({
    course_id: input.courseId, code, discount_type: input.discountType, discount_value: value,
    max_uses: input.maxUses && input.maxUses > 0 ? Math.round(input.maxUses) : null,
    expires_at: input.expiresAt || null, active: true,
  });
  if (error) return { ok: false, error: error.code === "23505" ? "That code already exists for this course." : error.message };
  revalidatePath("/academy/sell");
  return { ok: true };
}

export async function setCreatorCouponActive(couponId: string, active: boolean): Promise<R> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please sign in first." };
  const creator = await getCreatorByStudent(student.id);
  if (!creator) return { ok: false, error: "Creator profile not found." };

  const admin = createAdminClient();
  const { data: coupon } = await admin.from("creator_coupons").select("course_id").eq("id", couponId).maybeSingle();
  if (!coupon) return { ok: false, error: "Coupon not found." };
  const { data: course } = await admin.from("creator_courses").select("creator_id").eq("id", coupon.course_id).maybeSingle();
  if (course?.creator_id !== creator.id) return { ok: false, error: "Coupon not found." };

  const { error } = await admin.from("creator_coupons").update({ active }).eq("id", couponId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/academy/sell");
  return { ok: true };
}

export async function deleteCreatorCoupon(couponId: string): Promise<R> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please sign in first." };
  const creator = await getCreatorByStudent(student.id);
  if (!creator) return { ok: false, error: "Creator profile not found." };

  const admin = createAdminClient();
  const { data: coupon } = await admin.from("creator_coupons").select("course_id").eq("id", couponId).maybeSingle();
  if (!coupon) return { ok: true };
  const { data: course } = await admin.from("creator_courses").select("creator_id").eq("id", coupon.course_id).maybeSingle();
  if (course?.creator_id !== creator.id) return { ok: false, error: "Coupon not found." };

  const { error } = await admin.from("creator_coupons").delete().eq("id", couponId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/academy/sell");
  return { ok: true };
}
