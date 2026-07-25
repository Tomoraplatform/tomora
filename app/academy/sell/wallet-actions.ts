"use server";

import { revalidatePath } from "next/cache";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCreatorByStudent } from "@/lib/creator/db";
import { creatorBalance, MIN_WITHDRAWAL } from "@/lib/creator/money";
import { createTransferRecipient, initiateTransfer } from "@/lib/paystack";

type R = { ok: boolean; error?: string };

/**
 * Withdraws from the creator's wallet straight to their bank via Paystack
 * Transfers. The wallet row is written first (holding the funds), then the
 * transfer is initiated. If Paystack can't process it right now the row stays
 * pending and appears in the admin queue, so money is never lost either way.
 */
export async function requestCreatorPayout(amount: number): Promise<{ ok: boolean; error?: string; pending?: boolean }> {
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

  // Reserve the funds before calling Paystack. The unique (type, reference)
  // index makes a retry harmless.
  const { error: txErr } = await admin.from("creator_wallet_transactions").insert({
    creator_id: creator.id, type: "withdrawal", source: "payout",
    amount: value, status: "pending", reference,
    description: `Withdrawal to ${creator.bank_name || "bank"} ${creator.account_number}`,
  });
  if (txErr) return { ok: false, error: txErr.message };

  let status = "pending";
  let note = reference;
  try {
    const recipient = await createTransferRecipient({
      name: creator.account_name || creator.author_name,
      accountNumber: creator.account_number,
      bankCode: creator.bank_code,
    });
    const transfer = await initiateTransfer({
      amountNaira: value, recipient, reference,
      reason: `Tomora course earnings (${creator.author_name})`,
    });
    status = transfer.status === "success" ? "completed" : "pending";
    if (transfer.transferCode) note = `${reference} · ${transfer.transferCode}`;
  } catch (e: any) {
    // Transfers unavailable (e.g. OTP required or insufficient Paystack
    // balance): leave it pending for an admin to complete.
    note = `${reference} · ${String(e?.message || "transfer failed").slice(0, 120)}`;
  }

  if (status === "completed") {
    await admin.from("creator_wallet_transactions").update({ status: "completed" }).eq("reference", reference);
  }

  // Always log the request so admins can see and finish anything pending.
  await admin.from("creator_payouts").insert({
    creator_id: creator.id, amount: value,
    status: status === "completed" ? "paid" : "pending",
    note,
  });

  revalidatePath("/academy/sell");
  return { ok: true, pending: status !== "completed" };
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
