import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, magicLinkEmail } from "@/lib/email";
import type { Student } from "@/lib/types";

export function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

/**
 * Ensures a Supabase auth user exists for this email so that a magic link can
 * be generated for first-time (just-paid) students. Idempotent — ignores the
 * "already registered" error.
 */
async function ensureAuthUser(email: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.createUser({
    email: normalizeEmail(email),
    email_confirm: true,
  });
  if (error && !/already|registered|exists/i.test(error.message)) {
    // Non-fatal: generateLink may still create the user. Log and continue.
    console.warn("[ensureAuthUser]", error.message);
  }
}

export async function findApprovedStudent(
  email: string,
): Promise<Student | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (!data || !data.approved_status) return null;
  return data as Student;
}

/**
 * Generates a Supabase magic link for an approved student and emails it using
 * our branded template. The link expiry is controlled by the Supabase project's
 * Email OTP expiry setting (set it to 600 seconds = 10 minutes — see README).
 */
/**
 * Builds a magic link that lands on OUR server callback with a token_hash.
 * The callback verifies it with verifyOtp() server-side — no implicit/hash
 * flow, so it works reliably without any client-side token parsing.
 */
async function buildMagicLink(email: string, next: string) {
  const supabase = createAdminClient();
  await ensureAuthUser(email);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: normalizeEmail(email),
  });

  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) {
    throw new Error(error?.message || "Could not generate magic link");
  }

  const type = data.properties.verification_type || "magiclink";
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return (
    `${base}/auth/callback` +
    `?token_hash=${encodeURIComponent(hashedToken)}` +
    `&type=${encodeURIComponent(type)}` +
    `&next=${encodeURIComponent(next)}`
  );
}

export async function sendMagicLinkToStudent(student: {
  email: string;
  full_name: string;
}) {
  const link = await buildMagicLink(student.email, "/dashboard");
  const { subject, html } = magicLinkEmail(student.full_name || "there", link);
  await sendEmail({ to: student.email, subject, html });
}

/** Generates an admin magic link (admin_users gated by the caller). */
export async function sendAdminMagicLink(email: string) {
  const link = await buildMagicLink(email, "/admin/dashboard");
  const { subject, html } = magicLinkEmail("Admin", link);
  await sendEmail({ to: email, subject, html });
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);

  // ADMIN_EMAIL may be a single email or a comma-separated list.
  const envAdmins = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
  if (envAdmins.includes(normalized)) return true;

  // Or any email added to the admin_users table.
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  return !!data;
}
