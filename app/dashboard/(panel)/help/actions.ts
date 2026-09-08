"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/html";
import { SUPPORT_EMAIL } from "@/lib/support";

// The variable still wins, so support can be pointed elsewhere without a
// deploy, but the fallback is now the real inbox rather than a personal one.
const SUPPORT_INBOX = process.env.SUPPORT_EMAIL || SUPPORT_EMAIL;

/**
 * Takes a support request from the dashboard.
 *
 * The request is recorded first and emailed second. That order is the point:
 * email here is best-effort and has failed silently before, and this used to
 * report "Couldn't send right now" and drop the message entirely, so a user's
 * complaint was lost precisely when something was already wrong. Now it lands
 * in the admin dashboard either way, and the email is a notification rather
 * than the system of record.
 */
export async function sendSupportMessage(input: {
  subject: string;
  message: string;
  email?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };

    const subject = String(input.subject || "").trim().slice(0, 160) || "Support request";
    const message = String(input.message || "").trim().slice(0, 4000);
    // Whatever they typed, falling back to the address on the account.
    const replyTo = String(input.email || "").trim().slice(0, 160) || user.email || "";

    if (!message) return { ok: false, error: "Please type your message." };
    if (!replyTo || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo)) {
      return { ok: false, error: "Please enter the email address we should reply to." };
    }

    // Recorded before anything can fail.
    const admin = createAdminClient();
    const { data: saved, error: saveError } = await admin
      .from("help_requests")
      .insert({ user_id: user.id, email: replyTo, subject, message })
      .select("id")
      .maybeSingle();

    if (saveError) {
      // If it cannot even be stored, telling the user it worked would be a lie.
      console.error("[support] could not record help request:", saveError.message);
      return { ok: false, error: "We couldn't record your message. Please try again." };
    }

    const body = escapeHtml(message);
    const emailed = await sendEmail({
      to: SUPPORT_INBOX,
      subject: `Support: ${subject}`,
      html: `
        <h2>New support message</h2>
        <p><strong>From:</strong> ${escapeHtml(replyTo)}</p>
        <p><strong>Account:</strong> ${escapeHtml(user.email || user.id)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p style="white-space:pre-wrap">${body}</p>
        <p style="color:#666">Also in the admin dashboard under Support.</p>`,
    });

    if (!emailed) {
      // Worth knowing about, but not worth telling the user their message was
      // lost, because it was not.
      console.error("[support] help request recorded but the notification email failed");
    } else if (saved?.id) {
      await admin.from("help_requests").update({ emailed: true }).eq("id", saved.id);
    }

    // Acknowledge to the person who wrote in (best-effort).
    await sendEmail({
      to: replyTo,
      subject: "We've received your message. Tomora Support",
      html: `
        <p>Thanks for reaching out. Our team has your message and will reply to
        this email address shortly.</p>
        <p style="color:#666">Your message:</p>
        <p style="white-space:pre-wrap;color:#666">${body}</p>`,
    });

    return { ok: true };
  } catch (e: any) {
    console.error("[support] unexpected failure:", e?.message || e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
