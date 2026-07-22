"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMediaUploadUrl, createThumbnailUploadUrl } from "@/lib/academy/media";

async function guard() {
  if (!(await isAdmin())) throw new Error("Forbidden");
  return createAdminClient();
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "course";
}

type R = { ok: boolean; error?: string; id?: string };

/* ---------------- courses ---------------- */

export async function createCourse(input: { title: string }): Promise<R> {
  try {
    const admin = await guard();
    const base = slugify(input.title || "course");
    let slug = base;
    for (let i = 0; i < 6; i++) {
      const { data, error } = await admin.from("academy_courses")
        .insert({ title: input.title || "Untitled course", slug, sort_order: Date.now() % 100000 })
        .select("id").single();
      if (!error && data) { revalidatePath("/admin/academy"); return { ok: true, id: data.id }; }
      if (error?.code === "23505") { slug = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`; continue; }
      return { ok: false, error: error?.message || "Could not create course." };
    }
    return { ok: false, error: "Could not create course." };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function updateCourse(id: string, patch: Partial<{ title: string; slug: string; short_description: string; thumbnail_url: string; price: number; is_published: boolean; sort_order: number }>): Promise<R> {
  try {
    const admin = await guard();
    const clean: Record<string, unknown> = { ...patch };
    if (patch.slug !== undefined) clean.slug = slugify(patch.slug);
    if (patch.price !== undefined) clean.price = Math.max(0, Math.round(patch.price));
    const { error } = await admin.from("academy_courses").update(clean).eq("id", id);
    if (error) return { ok: false, error: error.code === "23505" ? "That slug is already taken." : error.message };
    revalidatePath("/admin/academy"); revalidatePath("/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteCourse(id: string): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_courses").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- modules ---------------- */

export async function addModule(courseId: string, title: string): Promise<R> {
  try {
    const admin = await guard();
    const { data, error } = await admin.from("academy_modules")
      .insert({ course_id: courseId, title: title || "New module", sort_order: Date.now() % 100000 })
      .select("id").single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true, id: data.id };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function updateModule(id: string, patch: Partial<{ title: string; sort_order: number }>): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_modules").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteModule(id: string): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_modules").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- lessons ---------------- */

export async function addLesson(input: { moduleId: string; courseId: string; title: string }): Promise<R> {
  try {
    const admin = await guard();
    const { data, error } = await admin.from("academy_lessons")
      .insert({ module_id: input.moduleId, course_id: input.courseId, title: input.title || "New lesson", sort_order: Date.now() % 100000 })
      .select("id").single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true, id: data.id };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function updateLesson(id: string, patch: Partial<{ title: string; video_path: string; slides_path: string; duration_seconds: number; is_preview: boolean; sort_order: number }>): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_lessons").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteLesson(id: string): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_lessons").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- enrollments (student access) ---------------- */

export async function grantAccess(courseId: string, email: string): Promise<R> {
  try {
    const admin = await guard();
    const norm = email.trim().toLowerCase();
    const { data: student } = await admin.from("academy_students").select("id").eq("email", norm).maybeSingle();
    if (!student) return { ok: false, error: "No student account with that email yet, they need to register on /academy first." };
    const { error } = await admin.from("academy_enrollments").insert({ student_id: student.id, course_id: courseId, source: "admin" });
    if (error && error.code !== "23505") return { ok: false, error: error.message };
    if (error?.code === "23505") return { ok: false, error: "That student already has access to this course." };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function revokeAccess(enrollmentId: string): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_enrollments").delete().eq("id", enrollmentId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- coupons ---------------- */

export async function createCoupon(input: {
  code: string; discountType: "percent" | "fixed"; discountValue: number;
  courseId?: string | null; maxUses?: number | null; expiresAt?: string | null;
}): Promise<R> {
  try {
    const admin = await guard();
    const code = (input.code || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!code) return { ok: false, error: "Enter a coupon code." };
    const value = Math.max(0, Math.round(input.discountValue || 0));
    if (input.discountType === "percent" && value > 100) return { ok: false, error: "Percent discount can't exceed 100." };
    const { error } = await admin.from("academy_coupons").insert({
      code, discount_type: input.discountType, discount_value: value,
      course_id: input.courseId || null,
      max_uses: input.maxUses && input.maxUses > 0 ? Math.round(input.maxUses) : null,
      expires_at: input.expiresAt || null, active: true,
    });
    if (error) return { ok: false, error: error.code === "23505" ? "That code already exists." : error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function setCouponActive(id: string, active: boolean): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_coupons").update({ active }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteCoupon(id: string): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_coupons").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- reviews ---------------- */

export async function addReview(input: { courseId: string; authorName: string; rating: number; body: string }): Promise<R> {
  try {
    const admin = await guard();
    const name = (input.authorName || "").trim();
    if (!name) return { ok: false, error: "Enter the student's name." };
    const rating = Math.min(5, Math.max(1, Math.round(input.rating || 5)));
    const { error } = await admin.from("academy_reviews").insert({
      course_id: input.courseId, author_name: name, rating, body: (input.body || "").trim(),
      sort_order: Date.now() % 100000,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy"); revalidatePath("/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function updateReview(id: string, patch: Partial<{ author_name: string; rating: number; body: string }>): Promise<R> {
  try {
    const admin = await guard();
    const clean: Record<string, unknown> = { ...patch };
    if (patch.rating !== undefined) clean.rating = Math.min(5, Math.max(1, Math.round(patch.rating)));
    const { error } = await admin.from("academy_reviews").update(clean).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy"); revalidatePath("/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteReview(id: string): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("academy_reviews").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/academy"); revalidatePath("/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- uploads (signed URLs) ---------------- */

export async function getMediaUploadUrl(kind: "video" | "slides", ext: string): Promise<{ ok: boolean; error?: string; path?: string; token?: string }> {
  try {
    await guard();
    const { path, token } = await createMediaUploadUrl(kind, ext);
    return { ok: true, path, token };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function getThumbnailUploadUrl(ext: string): Promise<{ ok: boolean; error?: string; path?: string; token?: string; publicUrl?: string }> {
  try {
    await guard();
    const { path, token, publicUrl } = await createThumbnailUploadUrl(ext);
    return { ok: true, path, token, publicUrl };
  } catch (e: any) { return { ok: false, error: e.message }; }
}
