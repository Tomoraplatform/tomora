"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendTikTokEvent } from "@/lib/tiktok/events-api";
import { TIKTOK_EVENTS } from "@/lib/tiktok/config";

export interface AuthState {
  error?: string;
  message?: string;
}

/** Builds a readable message from a Supabase auth error (avoids blank "{}"). */
function authError(error: { message?: string; status?: number; code?: string }): string {
  const msg = (error?.message || "").trim();
  if (msg && msg !== "{}") {
    // Common Supabase signup failure when the profile trigger errors.
    if (/database error saving new user/i.test(msg)) {
      return "We couldn't finish creating your account (database error). Please try again shortly.";
    }
    return msg;
  }
  if (error?.status === 500) {
    return "Server error creating your account. Please try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!name || !email || !password) {
    return { error: "Please fill in all fields." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = createClient();
  const origin = headers().get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: authError(error) };

  // A registration is worth measuring from the server: browser pixels are lost
  // often enough here that signups would be undercounted. The browser sends its
  // own copy on the page this lands on, under the same id, so TikTok counts one.
  const eventId = data.user?.id ? `signup_${data.user.id}` : `signup_${Date.now()}`;
  await sendTikTokEvent({
    event: TIKTOK_EVENTS.registration,
    eventId,
    email,
    url: `${origin}/signup`,
    ip: headers().get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: headers().get("user-agent") || undefined,
  });

  // If email confirmation is disabled, a session is returned immediately.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(`/onboarding?ttq=${encodeURIComponent(eventId)}`);
  }
  return {
    message:
      "Account created. Check your email to confirm your address, then log in.",
  };
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authError(error) };

  revalidatePath("/", "layout");

  // Signed up before but no website yet? Send them through the guided builder.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: sites } = await supabase.from("sites").select("id").eq("user_id", user.id).limit(1);
    if (!sites || sites.length === 0) redirect("/onboarding");
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Enter your email address." };

  const supabase = createClient();
  const origin = headers().get("origin") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard`,
  });
  if (error) return { error: error.message };
  return { message: "If that email exists, a reset link is on its way." };
}
