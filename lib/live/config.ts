/**
 * Tomora Live configuration.
 *
 * Live is monetised by a flat commission on every WhatsApp sale and nothing
 * else: activation is free for every seller and there is no Live subscription.
 * That is the whole pricing model, which is why there is no plan concept here.
 */

/** Taken from every WhatsApp order at wallet-credit time. */
export const LIVE_COMMISSION_PERCENT = 3;

/** Graph API version this integration is written against. */
export const GRAPH_VERSION = "v21.0";

/** Cart and catalogue limits, set by what WhatsApp itself accepts. */
export const LIMITS = {
  /** Rows in one interactive list. */
  listRows: 10,
  /** Characters in a list row title. */
  rowTitle: 24,
  /** Characters in a list row description. */
  rowDescription: 72,
  /** Reply buttons per message. */
  buttons: 3,
  /** Characters in a button label. */
  buttonTitle: 20,
  /** Characters in a body. */
  body: 1024,
  /** Units of one product in a cart. */
  maxQty: 99,
} as const;

export interface LiveCredentials {
  token: string;
  phoneNumberId: string;
  appSecret: string;
  verifyToken: string;
}

/**
 * Credentials for the shared Tomora number, or null when Live has not been
 * connected to Meta yet.
 *
 * Returning null rather than throwing is deliberate: every seller-facing screen
 * and every test must work before the Meta app exists, and the only thing that
 * should fail without credentials is actually sending a message.
 */
export function liveCredentials(): LiveCredentials | null {
  const token = process.env.WHATSAPP_TOKEN || "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const appSecret = process.env.WHATSAPP_APP_SECRET || "";
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "";
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId, appSecret, verifyToken };
}

/** True once Live can actually talk to WhatsApp. */
export function liveConfigured(): boolean {
  return liveCredentials() !== null;
}

/** The number customers message, for building wa.me links. Digits only. */
export function liveNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/[^\d]/g, "");
}

/**
 * The link that puts a customer in the seller's store.
 *
 * The prefilled text is what binds the conversation to a store: on one shared
 * number it is the only thing that says which seller the customer wants.
 */
export function storeLink(storeCode: string): string {
  const n = liveNumber();
  const text = encodeURIComponent(`SHOP ${storeCode}`);
  return n ? `https://wa.me/${n}?text=${text}` : `https://wa.me/?text=${text}`;
}

/**
 * A store code from a site's subdomain: short, unambiguous, and typeable by
 * someone who cannot click a link. Ambiguous characters are dropped so a code
 * read aloud or copied by hand still resolves.
 */
export function storeCodeFrom(subdomain: string): string {
  const cleaned = (subdomain || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[OIL]/g, (c) => ({ O: "0", I: "1", L: "1" }[c] as string));
  return cleaned.slice(0, 12) || "STORE";
}
