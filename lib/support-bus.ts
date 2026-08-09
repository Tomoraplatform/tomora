/**
 * Opens the support chat from anywhere on a published site.
 *
 * The chat widget and the storefront are siblings under a server component, so
 * a template's bottom bar cannot reach the widget's state through props. Both
 * sides agree on one browser event instead: the bar asks, the widget answers.
 */
const OPEN_SUPPORT = "tomora:open-support";

export function openSupport(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_SUPPORT));
}

/** Subscribes to open requests. Returns the unsubscribe for cleanup. */
export function onOpenSupport(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(OPEN_SUPPORT, handler);
  return () => window.removeEventListener(OPEN_SUPPORT, handler);
}
