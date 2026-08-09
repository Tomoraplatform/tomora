/**
 * Templates that carry their own bottom tab bar on phones.
 *
 * A published site normally floats a cart button in one corner and the support
 * chat launcher in the other. On a template that already has a bar those float
 * on top of it and cover its tabs, so the site hides them on small screens and
 * the bar carries cart and support itself.
 */
const MOBILE_BAR_TEMPLATES = new Set(["food-01"]);

export function ownsMobileBar(templateId: string): boolean {
  return MOBILE_BAR_TEMPLATES.has(templateId);
}
