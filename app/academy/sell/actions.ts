"use server";

import { revalidatePath } from "next/cache";
import { createSubaccount } from "@/lib/paystack";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCreatorByStudent } from "@/lib/creator/db";
import { slugifyHandle, handleAvailable, reserveHandle } from "@/lib/creator/handles";
import { createLessonUploadUrl, createPublicUploadUrl, normalizeLessonLink } from "@/lib/creator/media";

type R = { ok: boolean; error?: string; id?: string };

/** Loads the signed-in student's creator profile, or throws. */
async function requireCreator() {
  const student = await currentStudent();
  if (!student) throw new Error("Please sign in first.");
  const creator = await getCreatorByStudent(student.id);
  if (!creator) throw new Error("Set up your author profile first.");
  return { student, creator, admin: createAdminClient() };
}

/** Verifies a course belongs to the signed-in creator. */
async function ownCourse(courseId: string) {
  const ctx = await requireCreator();
  const { data } = await ctx.admin.from("creator_courses").select("id, creator_id").eq("id", courseId).maybeSingle();
  if (!data || data.creator_id !== ctx.creator.id) throw new Error("Course not found.");
  return ctx;
}

/* ---------------- author profile ---------------- */

export async function checkHandle(handle: string): Promise<{ ok: boolean; error?: string; handle?: string }> {
  const h = slugifyHandle(handle);
  const res = await handleAvailable(h);
  return res.ok ? { ok: true, handle: h } : res;
}

export async function saveCreatorProfile(input: {
  handle: string; authorName: string; authorBio: string; authorPhotoUrl?: string; showAuthor: boolean;
}): Promise<R> {
  try {
    const student = await currentStudent();
    if (!student) return { ok: false, error: "Please sign in first." };
    const name = (input.authorName || "").trim();
    if (!name) return { ok: false, error: "Enter your name as the author." };

    const admin = createAdminClient();
    const existing = await getCreatorByStudent(student.id);

    // Handle is only claimed on first setup; changing it later would break live links.
    if (!existing) {
      const h = slugifyHandle(input.handle);
      const avail = await handleAvailable(h);
      if (!avail.ok) return { ok: false, error: avail.error };
      const { data, error } = await admin.from("academy_creators").insert({
        student_id: student.id, slug: h, author_name: name,
        author_bio: (input.authorBio || "").trim(),
        author_photo_url: input.authorPhotoUrl || null,
        show_author: !!input.showAuthor,
      }).select("id").single();
      if (error) return { ok: false, error: error.code === "23505" ? "That name is taken." : error.message };
      await reserveHandle(h, "creator");
      revalidatePath("/academy/sell");
      return { ok: true, id: data.id };
    }

    const { error } = await admin.from("academy_creators").update({
      author_name: name,
      author_bio: (input.authorBio || "").trim(),
      author_photo_url: input.authorPhotoUrl || null,
      show_author: !!input.showAuthor,
    }).eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true, id: existing.id };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function saveCreatorBrand(input: {
  brandName?: string; logoUrl?: string; brandColor?: string; brandColor2?: string;
}): Promise<R> {
  try {
    const { admin, creator } = await requireCreator();
    const { error } = await admin.from("academy_creators").update({
      brand_name: input.brandName ?? creator.brand_name,
      logo_url: input.logoUrl ?? creator.logo_url,
      brand_color: input.brandColor || creator.brand_color,
      brand_color_2: input.brandColor2 || creator.brand_color_2,
    }).eq("id", creator.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/**
 * The account a creator's sales are paid into.
 *
 * Saving it also opens a Paystack subaccount, which is what lets a sale settle
 * to them directly instead of landing in Tomora's balance and waiting for a
 * withdrawal. Without one their courses cannot be sold.
 */
export async function saveCreatorPayout(input: {
  bankName: string; bankCode: string; accountNumber: string; accountName: string;
}): Promise<R> {
  try {
    const { admin, creator } = await requireCreator();
    if (!/^\d{10}$/.test((input.accountNumber || "").trim())) return { ok: false, error: "Enter a valid 10 digit account number." };

    let subaccount: string | null = null;
    try {
      // Tomora's cut is taken per transaction, not as a standing percentage on
      // the subaccount, because the 3% is charged on the course price while
      // Paystack collects that plus VAT and its own fee.
      const made = await createSubaccount({
        businessName: creator.brand_name || creator.author_name || "Tomora creator",
        bankCode: input.bankCode,
        accountNumber: input.accountNumber.trim(),
        percentageCharge: 0,
      });
      subaccount = made.subaccountCode;
    } catch (e: any) {
      return { ok: false, error: e?.message || "Paystack could not verify that account. Check the number and bank." };
    }

    const { error } = await admin.from("academy_creators").update({
      bank_name: input.bankName, bank_code: input.bankCode,
      account_number: input.accountNumber.trim(), account_name: input.accountName.trim(),
      paystack_subaccount: subaccount,
    }).eq("id", creator.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- courses ---------------- */

export async function createCreatorCourse(input: { title: string; description?: string; bannerUrl?: string }): Promise<R> {
  try {
    const { admin, creator } = await requireCreator();
    const title = (input.title || "").trim();
    if (!title) return { ok: false, error: "Enter a course title." };
    if (!input.bannerUrl) return { ok: false, error: "A course banner is required." };

    const base = slugifyHandle(title) || "course";
    for (let i = 0; i < 6; i++) {
      const slug = i === 0 ? base : `${base}-${Math.floor(Math.random() * 900 + 100)}`;
      const { data, error } = await admin.from("creator_courses").insert({
        creator_id: creator.id, title, slug,
        description: (input.description || "").trim(),
        banner_url: input.bannerUrl,
      }).select("id").single();
      if (!error && data) { revalidatePath("/academy/sell"); return { ok: true, id: data.id }; }
      if (error?.code !== "23505") return { ok: false, error: error?.message };
    }
    return { ok: false, error: "Could not create the course." };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function updateCreatorCourse(courseId: string, patch: Partial<{
  title: string; description: string; banner_url: string; price: number; compare_price: number | null;
  is_published: boolean; is_active: boolean; sales_page: Record<string, unknown>;
}>): Promise<R> {
  try {
    const { admin } = await ownCourse(courseId);
    const clean: Record<string, unknown> = { ...patch };
    if (patch.price !== undefined) clean.price = Math.max(0, Math.round(patch.price));
    if (patch.compare_price !== undefined) clean.compare_price = patch.compare_price == null ? null : Math.max(0, Math.round(patch.compare_price));
    if (patch.title !== undefined && !String(patch.title).trim()) return { ok: false, error: "Title can't be empty." };
    const { error } = await admin.from("creator_courses").update(clean).eq("id", courseId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/academy/sell");
    // Push the change to the live sales page too, so editing after publishing
    // updates what visitors see straight away.
    const { data: row } = await admin.from("creator_courses").select("slug, creator_id").eq("id", courseId).maybeSingle();
    if (row) {
      const { data: c } = await admin.from("academy_creators").select("slug").eq("id", row.creator_id).maybeSingle();
      if (c?.slug) {
        revalidatePath(`/c/${c.slug}`);
        revalidatePath(`/c/${c.slug}/${row.slug}`);
      }
    }
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteCreatorCourse(courseId: string): Promise<R> {
  try {
    const { admin } = await ownCourse(courseId);
    const { error } = await admin.from("creator_courses").delete().eq("id", courseId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- curriculum ---------------- */

export async function addCreatorModule(courseId: string, title: string): Promise<R> {
  try {
    const { admin } = await ownCourse(courseId);
    const { data, error } = await admin.from("creator_modules")
      .insert({ course_id: courseId, title: (title || "New module").trim(), sort_order: Date.now() % 100000 })
      .select("id").single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true, id: data.id };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function updateCreatorModule(moduleId: string, title: string): Promise<R> {
  try {
    const { admin, creator } = await requireCreator();
    const { data: mod } = await admin.from("creator_modules").select("course_id").eq("id", moduleId).maybeSingle();
    if (!mod) return { ok: false, error: "Module not found." };
    const { data: course } = await admin.from("creator_courses").select("creator_id").eq("id", mod.course_id).maybeSingle();
    if (course?.creator_id !== creator.id) return { ok: false, error: "Module not found." };
    const { error } = await admin.from("creator_modules").update({ title: (title || "").trim() || "Module" }).eq("id", moduleId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteCreatorModule(moduleId: string): Promise<R> {
  try {
    const { admin, creator } = await requireCreator();
    const { data: mod } = await admin.from("creator_modules").select("course_id").eq("id", moduleId).maybeSingle();
    if (!mod) return { ok: true };
    const { data: course } = await admin.from("creator_courses").select("creator_id").eq("id", mod.course_id).maybeSingle();
    if (course?.creator_id !== creator.id) return { ok: false, error: "Module not found." };
    const { error } = await admin.from("creator_modules").delete().eq("id", moduleId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function addCreatorLesson(input: {
  courseId: string; moduleId: string; title: string; description?: string;
  lessonType: "video" | "link" | "pdf"; mediaPath?: string; mediaUrl?: string; isPreview?: boolean;
}): Promise<R> {
  try {
    const { admin } = await ownCourse(input.courseId);
    const title = (input.title || "").trim();
    if (!title) return { ok: false, error: "Enter a lesson name." };

    let mediaUrl: string | null = null;
    if (input.lessonType === "link") {
      const link = normalizeLessonLink(input.mediaUrl || "");
      if (!link.ok) return { ok: false, error: link.error };
      mediaUrl = link.url!;
    }

    const { data, error } = await admin.from("creator_lessons").insert({
      module_id: input.moduleId, course_id: input.courseId, title,
      description: (input.description || "").trim(),
      lesson_type: input.lessonType,
      media_path: input.lessonType === "link" ? null : (input.mediaPath || null),
      media_url: mediaUrl,
      is_preview: !!input.isPreview,
      sort_order: Date.now() % 100000,
    }).select("id").single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true, id: data.id };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function updateCreatorLesson(lessonId: string, patch: Partial<{
  title: string; description: string; lesson_type: "video" | "link" | "pdf";
  media_path: string | null; media_url: string | null; is_preview: boolean;
}>): Promise<R> {
  try {
    const { admin, creator } = await requireCreator();
    const { data: lesson } = await admin.from("creator_lessons").select("course_id").eq("id", lessonId).maybeSingle();
    if (!lesson) return { ok: false, error: "Lesson not found." };
    const { data: course } = await admin.from("creator_courses").select("creator_id").eq("id", lesson.course_id).maybeSingle();
    if (course?.creator_id !== creator.id) return { ok: false, error: "Lesson not found." };

    const clean: Record<string, unknown> = { ...patch };
    if (patch.media_url) {
      const link = normalizeLessonLink(patch.media_url);
      if (!link.ok) return { ok: false, error: link.error };
      clean.media_url = link.url;
    }
    const { error } = await admin.from("creator_lessons").update(clean).eq("id", lessonId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteCreatorLesson(lessonId: string): Promise<R> {
  try {
    const { admin, creator } = await requireCreator();
    const { data: lesson } = await admin.from("creator_lessons").select("course_id").eq("id", lessonId).maybeSingle();
    if (!lesson) return { ok: true };
    const { data: course } = await admin.from("creator_courses").select("creator_id").eq("id", lesson.course_id).maybeSingle();
    if (course?.creator_id !== creator.id) return { ok: false, error: "Lesson not found." };
    const { error } = await admin.from("creator_lessons").delete().eq("id", lessonId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/academy/sell");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/* ---------------- uploads ---------------- */

export async function getLessonUploadUrl(kind: "video" | "pdf", ext: string): Promise<{ ok: boolean; error?: string; path?: string; token?: string }> {
  try {
    await requireCreator();
    const { path, token } = await createLessonUploadUrl(kind, ext);
    return { ok: true, path, token };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/** Public image upload; allowed before the profile exists (author photo on signup). */
export async function getPublicUploadUrl(kind: "banner" | "logo" | "author" | "section", ext: string): Promise<{ ok: boolean; error?: string; path?: string; token?: string; publicUrl?: string }> {
  try {
    const student = await currentStudent();
    if (!student) return { ok: false, error: "Please sign in first." };
    const { path, token, publicUrl } = await createPublicUploadUrl(kind, ext);
    return { ok: true, path, token, publicUrl };
  } catch (e: any) { return { ok: false, error: e.message }; }
}
