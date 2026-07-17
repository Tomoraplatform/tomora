import "server-only";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE = "tomora_academy_session";
const SESSION_DAYS = 30;

export interface AcademyStudent {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

const normEmail = (e: string) => e.trim().toLowerCase();
const hash = (password: string, salt: string) => scryptSync(password, salt, 64).toString("hex");

/** The signed-in student for the current request, or null. */
export async function currentStudent(): Promise<AcademyStudent | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("academy_sessions").select("student_id, expires_at").eq("token", token).maybeSingle();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  const { data: student } = await admin
    .from("academy_students").select("id, email, name, created_at").eq("id", session.student_id).maybeSingle();
  return (student as AcademyStudent) || null;
}

async function startSession(studentId: string) {
  const admin = createAdminClient();
  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await admin.from("academy_sessions").insert({ token, student_id: studentId, expires_at: expires.toISOString() });
  cookies().set(COOKIE, token, {
    path: "/", httpOnly: true, sameSite: "lax", secure: true, maxAge: SESSION_DAYS * 86400,
  });
}

export async function registerStudent(input: { name: string; email: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  const name = input.name?.trim();
  const email = normEmail(input.email || "");
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!input.password || input.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  const admin = createAdminClient();
  const salt = randomBytes(16).toString("hex");
  const { data, error } = await admin
    .from("academy_students")
    .insert({ email, name, salt, password_hash: hash(input.password, salt) })
    .select("id").single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "An account with this email already exists, sign in instead." };
    return { ok: false, error: error.message };
  }
  await startSession(data.id);
  return { ok: true };
}

export async function loginStudent(input: { email: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  const email = normEmail(input.email || "");
  const admin = createAdminClient();
  const { data: student } = await admin
    .from("academy_students").select("id, salt, password_hash").eq("email", email).maybeSingle();
  // Constant-time-ish check even when the account doesn't exist.
  const candidate = hash(input.password || "", student?.salt || "0f".repeat(16));
  const stored = student?.password_hash || candidate.replace(/./g, "0");
  const match = candidate.length === stored.length && timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
  if (!student || !match) return { ok: false, error: "Wrong email or password." };
  await startSession(student.id);
  return { ok: true };
}

export async function logoutStudent(): Promise<void> {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    const admin = createAdminClient();
    await admin.from("academy_sessions").delete().eq("token", token);
  }
  cookies().delete(COOKIE);
}
