/**
 * Escapes a value before it goes into markup.
 *
 * Names, messages and product titles are typed by people and end up in emails
 * someone trusts, so an unescaped one could put working markup in a reader's
 * inbox.
 *
 * This lives apart from lib/email on purpose: tests routinely mock the email
 * module, and an escaper that disappears under a mock is worse than none, it
 * fails silently in exactly the code paths meant to be safe.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A plain-text version of an HTML email body.
 *
 * Mail sent as HTML alone is a well-known spam signal: real senders provide
 * both parts, and filters notice when only one is present. This is not a
 * general HTML renderer, only enough to give a readable alternative, with
 * links kept as text so nothing is lost to someone reading the plain part.
 */
export function htmlToText(html: string): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) =>
      `${String(label).replace(/<[^>]+>/g, "").trim()} (${href})`)
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|h[1-6]|ul|ol|tr)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8358;/g, "NGN ")
    .replace(/&mdash;/g, "-")
    .replace(/&#10003;/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
