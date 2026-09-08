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
