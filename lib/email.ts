import "server-only";
import { SUPPORT_EMAIL } from "@/lib/support";
import { escapeHtml } from "@/lib/html";

/**
 * Sends a transactional email via Resend. Best-effort: if RESEND_API_KEY is not
 * configured it simply returns false (no crash), so callers can stay resilient.
 * Set EMAIL_FROM to a verified sender (e.g. "Tomora <orders@tomora.com.ng>").
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM || "Tomora <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * The first email a new account receives.
 *
 * Supabase sends its own "confirm your address" mail; this is the separate one
 * that says what Tomora is for and what to do next. Kept short on purpose: the
 * single job of a welcome email is to get someone to the first useful screen.
 */
export async function sendWelcomeEmail(params: {
  to: string;
  name?: string | null;
}): Promise<boolean> {
  const first = escapeHtml((params.name || "").trim().split(/\s+/)[0] || "there");
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tomora.com.ng";

  return sendEmail({
    to: params.to,
    subject: "Welcome to Tomora",
    html: `
      <h2>Welcome, ${first}!</h2>
      <p>Your Tomora account is ready. Tomora lets you build a real website for
      your business, take payments, and go live on your own web address, with no
      developer and no code.</p>
      <p><strong>Three steps to your first site:</strong></p>
      <ol>
        <li>Pick a template that fits your business.</li>
        <li>Add your logo, your brand colour and your products.</li>
        <li>Publish, and share your link.</li>
      </ol>
      <p><a href="${site}/onboarding">Start building your site</a></p>
      <p>If you get stuck, reply to this email or write to
      <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> and a person will answer.</p>
      <p>&mdash; The Tomora team</p>`,
  });
}
