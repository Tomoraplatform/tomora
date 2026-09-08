import "server-only";
import { SUPPORT_EMAIL } from "@/lib/support";
import { escapeHtml } from "@/lib/html";

/**
 * The sender address, repaired if EMAIL_FROM was typed slightly wrong.
 *
 * This variable is set by hand in a dashboard and has broken every email the
 * product sends twice already: once as a misspelt domain, once as
 * `Tomora <support@tomora.com.ng` with no closing bracket. Resend answers a
 * malformed sender with a 422 and nothing is delivered, which looks exactly
 * like everything working until someone notices no mail ever arrives.
 *
 * So a recoverable mistake is repaired and reported rather than allowed to
 * silence the whole system. Anything unrecoverable falls back to a plain
 * address, which Resend always accepts.
 */
export function senderAddress(): string {
  const raw = (process.env.EMAIL_FROM || "").trim();
  if (!raw) return "Tomora <onboarding@resend.dev>";

  // Already valid: either "a@b.com" or "Name <a@b.com>".
  if (/^[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+$/.test(raw)) return raw;
  if (/^[^<>]*<[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+>$/.test(raw)) return raw;

  // An unclosed angle bracket is the mistake that is safe to repair.
  const unclosed = raw.match(/^([^<>]*)<\s*([^<>@\s]+@[^<>@\s]+\.[^<>@\s]+)\s*>?$/);
  if (unclosed) {
    const fixed = `${unclosed[1].trim()} <${unclosed[2]}>`.trim();
    console.warn(`[email] EMAIL_FROM was malformed (${JSON.stringify(raw)}); using ${JSON.stringify(fixed)}. Fix the variable.`);
    return fixed;
  }

  // Otherwise take the first address that looks like one, and say so.
  const bare = raw.match(/[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+/);
  if (bare) {
    console.warn(`[email] EMAIL_FROM is not a valid sender (${JSON.stringify(raw)}); using ${JSON.stringify(bare[0])}. Fix the variable.`);
    return bare[0];
  }

  console.error(`[email] EMAIL_FROM has no usable address (${JSON.stringify(raw)}); falling back to the Resend test sender.`);
  return "Tomora <onboarding@resend.dev>";
}

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
  if (!key) {
    console.error("[email] RESEND_API_KEY is not set; nothing was sent");
    return false;
  }
  const from = senderAddress();
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });
    if (!res.ok) {
      // Say why. A silent false here is how a wrong sender address went
      // unnoticed for weeks: every caller treats sending as best-effort, so
      // without this the only symptom is mail that never arrives.
      const detail = await res.text().catch(() => "");
      console.error(
        `[email] Resend rejected the send: ${res.status} ${res.statusText}. ` +
        `from=${JSON.stringify(from)} subject=${JSON.stringify(params.subject)} ${detail.slice(0, 500)}`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] could not reach Resend:", err);
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
