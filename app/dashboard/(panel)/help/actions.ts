"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

const SUPPORT_INBOX = process.env.SUPPORT_EMAIL || "templateroom1@gmail.com";

/** Sends the logged-in user's support message to the Tomora support inbox. */
export async function sendSupportMessage(input: { subject: string; message: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };

    const subject = String(input.subject || "").trim().slice(0, 160) || "Support request";
    const message = String(input.message || "").trim().slice(0, 4000);
    if (!message) return { ok: false, error: "Please type your message." };

    const sent = await sendEmail({
      to: SUPPORT_INBOX,
      subject: `Support: ${subject}`,
      html: `
        <h2>New support message</h2>
        <p><strong>From:</strong> ${user.email || user.id}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p style="white-space:pre-wrap">${message.replace(/</g, "&lt;")}</p>`,
    });
    if (!sent) return { ok: false, error: "Couldn't send right now. Please email us directly." };

    // Acknowledge to the user (best-effort).
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "We've received your message — Tomora Support",
        html: `<p>Thanks for reaching out. Our team has your message and will reply to this email address shortly.</p><p style="color:#666">Your message:</p><p style="white-space:pre-wrap;color:#666">${message.replace(/</g, "&lt;")}</p>`,
      });
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
