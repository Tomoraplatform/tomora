"use server";

import { headers } from "next/headers";
import { currentStudent, registerStudent, loginStudent, logoutStudent } from "@/lib/academy/auth";
import { initTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOMIVO_PLANS, type TomivoPlanId } from "@/lib/tomivo/constants";
import { rateLimit, clientIp } from "@/lib/rate-limit";

type R = { ok: boolean; error?: string };
const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

/* Accounts are the shared Tomora account (same as the Academy). */
export async function signUp(input: { name: string; email: string; password: string }): Promise<R> {
  if (!rateLimit(`tomivo-signup:${clientIp()}`, 5, 10 * 60_000)) return { ok: false, error: TOO_MANY };
  return registerStudent(input);
}
export async function signIn(input: { email: string; password: string }): Promise<R> {
  if (!rateLimit(`tomivo-signin:${clientIp()}`, 10, 10 * 60_000)) return { ok: false, error: TOO_MANY };
  return loginStudent(input);
}
export async function signOut(): Promise<R> {
  await logoutStudent();
  return { ok: true };
}

/** Starts a Paystack checkout for a Designs subscription (charged in Naira). */
export async function subscribe(planId: TomivoPlanId): Promise<{ ok: boolean; error?: string; url?: string }> {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Please create an account or sign in first." };
  const plan = TOMIVO_PLANS[planId];
  if (!plan) return { ok: false, error: "Unknown plan." };

  const origin = headers().get("origin") || `https://${headers().get("host")}`;
  const reference = `tomdsn_${student.id.slice(0, 8)}_${Date.now()}`;
  try {
    const data = await initTransaction({
      email: student.email,
      amountNaira: plan.ngn,
      reference,
      callbackUrl: `${origin}/api/tomivo/callback`,
      metadata: {
        purpose: "tomivo",
        studentId: student.id,
        plan: planId,
        custom_fields: [{ display_name: "Product", variable_name: "product", value: `Tomora AI Designs (${plan.label})` }],
      },
    });
    return { ok: true, url: data.authorization_url };
  } catch (e: any) {
    return { ok: false, error: e.message || "Could not start checkout." };
  }
}

/** Marketing email capture (pre-account interest). */
export async function joinWaitlist(email: string): Promise<R> {
  const clean = (email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false, error: "Enter a valid email." };
  if (!rateLimit(`tomivo-wait:${clientIp()}`, 5, 10 * 60_000)) return { ok: false, error: TOO_MANY };
  const admin = createAdminClient();
  const { error } = await admin.from("tomivo_signups").insert({ email: clean });
  if (error && error.code !== "23505") return { ok: false, error: error.message };
  return { ok: true };
}
