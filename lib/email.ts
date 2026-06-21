import "server-only";

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
