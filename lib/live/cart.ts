import { LIMITS } from "./config";

/**
 * The cart, and the conversation state it lives in.
 *
 * Pure data and pure functions. The cart is held server-side and every line
 * carries the price that was quoted at the time, but that price is never what
 * the customer is charged: checkout re-reads the product rows and prices the
 * order from those. A stale cart can therefore show an old price for a moment,
 * and can never buy at one.
 */

export interface CartLine {
  productId: string;
  name: string;
  /** Naira, as quoted when it was added. Display only. */
  price: number;
  qty: number;
}

export type Screen =
  | "start"        // no store bound yet
  | "home"
  | "categories"
  | "products"
  | "product"
  | "cart"
  | "ask_name"
  | "ask_address"
  | "confirm"
  | "paying"
  | "track";

export interface ConversationState {
  screen: Screen;
  siteId?: string;
  storeCode?: string;
  cart: CartLine[];
  /** The product currently being looked at. */
  viewing?: string;
  /** Category filter for the product list, and its page. */
  category?: string;
  page?: number;
  buyer?: { name?: string; address?: string };
  /** Reference of the order awaiting payment. */
  pendingReference?: string;
}

export function emptyState(): ConversationState {
  return { screen: "start", cart: [] };
}

/** Normalises whatever was stored, so a hand-edited or older row cannot crash a reply. */
export function readState(raw: unknown): ConversationState {
  const s = (raw || {}) as Partial<ConversationState>;
  const cart = Array.isArray(s.cart)
    ? s.cart
        .filter((l): l is CartLine => !!l && typeof l.productId === "string")
        .map((l) => ({
          productId: l.productId,
          name: String(l.name || "Item"),
          price: Math.max(0, Math.round(Number(l.price) || 0)),
          qty: clampQty(Number(l.qty) || 1),
        }))
    : [];
  return {
    screen: (s.screen as Screen) || "start",
    siteId: s.siteId,
    storeCode: s.storeCode,
    cart,
    viewing: s.viewing,
    category: s.category,
    page: Math.max(0, Number(s.page) || 0),
    buyer: s.buyer && typeof s.buyer === "object" ? s.buyer : undefined,
    pendingReference: s.pendingReference,
  };
}

export function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(LIMITS.maxQty, Math.round(n)));
}

/** Adds a product, or raises its quantity if it is already in the cart. */
export function addToCart(
  cart: CartLine[],
  item: { productId: string; name: string; price: number },
  qty = 1
): CartLine[] {
  const existing = cart.find((l) => l.productId === item.productId);
  if (existing) {
    return cart.map((l) =>
      l.productId === item.productId ? { ...l, qty: clampQty(l.qty + qty) } : l
    );
  }
  return [...cart, { ...item, price: Math.max(0, Math.round(item.price)), qty: clampQty(qty) }];
}

/** Changes a line's quantity by a delta, removing it when it reaches zero. */
export function stepQty(cart: CartLine[], productId: string, delta: number): CartLine[] {
  return cart
    .map((l) => (l.productId === productId ? { ...l, qty: Math.round(l.qty + delta) } : l))
    .filter((l) => l.qty > 0)
    .map((l) => ({ ...l, qty: clampQty(l.qty) }));
}

export function removeFromCart(cart: CartLine[], productId: string): CartLine[] {
  return cart.filter((l) => l.productId !== productId);
}

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.price * l.qty, 0);
}

export function cartCount(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.qty, 0);
}
