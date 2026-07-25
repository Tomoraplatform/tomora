"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { currentStudent, registerStudent, loginStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction } from "@/lib/paystack";
import { isCreatorEnrolled } from "@/lib/creator/db";
import { validateCreatorCoupon } from "@/lib/creator/purchase";
import { splitSale } from "@/lib/creator/money";
import { APP_DOMAIN } from "@/lib/constants";
import { rateLimit, clientIp } from "@/lib/rate-limit";

type R = { ok: boolean; error?: string };
const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

/* Buyers use the same shared Tomora Academy account. */
export async function buyerSignUp(input: { name: string; email: string; password: string }): Promise<R> {
  if (!rateLimit(`crs-signup:${clientIp()}`, 5, 10 * 60_000)) return { ok: false, error: TOO_MANY };
  return registerStudent(input);
}
export async function buyerSignIn(input: { email: string; password: string }): Promise<R> {
  if (!rateLimit(`crs-signin:${clientIp()}`, 10, 10 * 60_000)) return { ok: false, error: TOO_MANY };
  return loginStudent(input);
}

/** Price preview for the checkout UI: coupon + VAT. */
export async function previewCreatorPrice(courseId: string, couponCode?: string): Promise<{
  ok: boolean; error?: string; price?: number; vat?: number; total?: number; discountLabel?: string;
}> {
  const admin = createAdminClient();
  const { data: course } = await admin.from("creator_courses").select("price").eq("id", courseId).maybeSingle();
  if (!course) return { ok: false, error: "Course not found." };

  let price = course.price;
  let discountLabel: string | undefined;
  if (couponCode?.trim()) {
    const res = await validateCreatorCoupon(courseId, couponCode, course.price);
    if (!res.ok) return { ok: false, error: res.error };
    price = res.discountedPrice ?? course.price;
    discountLabel = res.discountLabel;
  }
  const split = splitSale(price);
  return { ok: true, price: split.price, vat: split.vat, total: split.gross, discountLabel };
}

/**
 * Starts checkout for a creator course. The student is charged price + 7.5%
 * VAT; the split happens on settlement.
 */
export async function buyCreatorCourse(courseId: string, couponCode?: string): Promise<{
  ok: boolean; error?: string; url?: string; enrolled?: boolean;
}> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please create an account or sign in first." };

  const admin = createAdminClient();
  const { data: course } = await admin.from("creator_courses")
    .select("id, title, slug, price, is_published, is_active, creator_id").eq("id", courseId).maybeSingle();
  if (!course || !course.is_published || !course.is_active) return { ok: false, error: "This course isn't available." };
  if (await isCreatorEnrolled(student.id, course.id)) return { ok: true, enrolled: true };

  let price = course.price;
  let couponId: string | undefined;
  if (couponCode?.trim()) {
    const res = await validateCreatorCoupon(course.id, couponCode, course.price);
    if (!res.ok) return { ok: false, error: res.error };
    price = res.discountedPrice ?? course.price;
    couponId = res.couponId;
  }

  // Free (or fully discounted) course: enroll immediately.
  if (price <= 0) {
    const { error } = await admin.from("creator_enrollments").insert({
      student_id: student.id, course_id: course.id, source: price === 0 ? "free" : "purchase",
    });
    if (error && error.code !== "23505") return { ok: false, error: error.message };
    revalidatePath("/academy/portal");
    return { ok: true, enrolled: true };
  }

  const split = splitSale(price);
  const origin = headers().get("origin") || `https://${APP_DOMAIN}`;
  const reference = `crs_${course.id.slice(0, 8)}_${Date.now()}`;
  try {
    const data = await initTransaction({
      email: student.email,
      amountNaira: split.gross,          // price + VAT
      reference,
      callbackUrl: `${origin}/api/creator/callback`,
      metadata: {
        purpose: "creator_course",
        studentId: student.id, courseId: course.id,
        netPrice: split.price,
        ...(couponId ? { couponId } : {}),
        custom_fields: [{ display_name: "Course", variable_name: "course", value: course.title }],
      },
    });
    return { ok: true, url: data.authorization_url };
  } catch (e: any) {
    return { ok: false, error: e.message || "Could not start payment." };
  }
}
