export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;         // percent (0-100) or fixed naira amount
  minOrder?: number;     // minimum order subtotal (naira) to qualify
  expiresAt?: string;    // ISO date; empty = never expires
  active: boolean;
}

/**
 * Validates a coupon code against a subtotal and returns the naira discount.
 * Shared by the storefront (for display) and the checkout API (authoritative).
 */
export function validateCoupon(
  coupons: Coupon[] | undefined,
  code: string,
  subtotal: number
): { coupon?: Coupon; discount: number; error?: string } {
  const wanted = (code || "").trim().toLowerCase();
  if (!wanted) return { discount: 0 };
  const c = (coupons || []).find((x) => (x.code || "").trim().toLowerCase() === wanted);
  if (!c) return { discount: 0, error: "That code isn't valid." };
  if (!c.active) return { discount: 0, error: "This code is no longer active." };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { discount: 0, error: "This code has expired." };
  if (c.minOrder && subtotal < c.minOrder) {
    return { discount: 0, error: `Add more to your cart to use this code (minimum order applies).` };
  }
  let discount = c.type === "percent"
    ? Math.round(subtotal * (Math.min(100, Math.max(0, c.value)) / 100))
    : Math.round(Math.max(0, c.value));
  discount = Math.max(0, Math.min(discount, subtotal));
  return { coupon: c, discount };
}
