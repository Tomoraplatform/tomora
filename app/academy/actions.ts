"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction } from "@/lib/paystack";
import { registerStudent, loginStudent, logoutStudent, currentStudent } from "@/lib/academy/auth";
import { isEnrolled } from "@/lib/academy/db";
import { APP_DOMAIN } from "@/lib/constants";
import { rateLimit, clientIp } from "@/lib/rate-limit";

type R = { ok: boolean; error?: string };

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

export async function signUpStudent(input: { name: string; email: string; password: string }): Promise<R> {
  if (!rateLimit(`acad-signup:${clientIp()}`, 5, 10 * 60_000)) return { ok: false, error: TOO_MANY };
  return registerStudent(input);
}

export async function signInStudent(input: { email: string; password: string }): Promise<R> {
  const ip = clientIp();
  if (!rateLimit(`acad-signin:${ip}`, 10, 10 * 60_000) ||
      !rateLimit(`acad-signin-email:${(input.email || "").toLowerCase().trim()}`, 8, 10 * 60_000)) {
    return { ok: false, error: TOO_MANY };
  }
  return loginStudent(input);
}

export async function signOutStudent(): Promise<R> {
  await logoutStudent();
  return { ok: true };
}

/** Starts a Paystack checkout for a course. Free courses enroll instantly. */
export async function purchaseCourse(courseId: string): Promise<{ ok: boolean; error?: string; url?: string; enrolled?: boolean }> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please sign in first." };

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("academy_courses").select("id, title, price, is_published").eq("id", courseId).maybeSingle();
  if (!course || !course.is_published) return { ok: false, error: "Course not found." };
  if (await isEnrolled(student.id, course.id)) return { ok: true, enrolled: true };

  // Free course, enroll straight away.
  if (!course.price || course.price <= 0) {
    const { error } = await admin.from("academy_enrollments").insert({
      student_id: student.id, course_id: course.id, source: "free",
    });
    if (error && error.code !== "23505") return { ok: false, error: error.message };
    revalidatePath("/academy/portal");
    return { ok: true, enrolled: true };
  }

  const origin = headers().get("origin") || `https://${APP_DOMAIN}`;
  const reference = `acad_${student.id.slice(0, 8)}_${Date.now()}`;
  try {
    const data = await initTransaction({
      email: student.email,
      amountNaira: course.price,
      reference,
      callbackUrl: `${origin}/api/academy/callback`,
      metadata: {
        purpose: "academy", studentId: student.id, courseId: course.id,
        custom_fields: [{ display_name: "Course", variable_name: "course", value: course.title }],
      },
    });
    return { ok: true, url: data.authorization_url };
  } catch (e: any) {
    return { ok: false, error: e.message || "Could not start payment." };
  }
}

/** Toggles a lesson's completed state for the signed-in, enrolled student. */
export async function setLessonComplete(lessonId: string, complete: boolean): Promise<R> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please sign in first." };

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("academy_lessons").select("id, course_id").eq("id", lessonId).maybeSingle();
  if (!lesson) return { ok: false, error: "Lesson not found." };
  if (!(await isEnrolled(student.id, lesson.course_id))) return { ok: false, error: "Not enrolled." };

  if (complete) {
    const { error } = await admin.from("academy_progress").insert({ student_id: student.id, lesson_id: lessonId });
    if (error && error.code !== "23505") return { ok: false, error: error.message };
  } else {
    await admin.from("academy_progress").delete().eq("student_id", student.id).eq("lesson_id", lessonId);
  }
  return { ok: true };
}
