import { formatNaira } from "@/lib/utils";

/**
 * Order code and the WhatsApp hand-off. Pure helpers, shared by the storefront
 * and the API, so nothing `server-only` may be imported here.
 */

export interface OrderLine {
  name: string;
  qty: number;
  /** Line total in naira (unit price times qty). */
  amount: number;
}

export interface OrderSummary {
  reference: string;
  restaurantName: string;
  lines: OrderLine[];
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  fulfilment: "delivery" | "pickup";
  /** Delivery zone name, or the pickup address. */
  place?: string | null;
  deliveryFee?: number;
  total: number;
  etaMins?: number | null;
  customer: { name: string; phone?: string; address?: string; note?: string };
  paid: boolean;
}

/**
 * A short, human order number the kitchen can call out. Derived from the
 * payment reference so it needs no extra column and always matches the order
 * the dashboard shows.
 */
export function orderCode(reference: string): string {
  const tail = (reference || "").replace(/[^a-z0-9]/gi, "").slice(-5).toUpperCase();
  return `#${tail.padStart(5, "0")}`;
}

/** Digits only, so wa.me accepts it. Drops a leading 0 for a Nigerian number. */
export function normaliseWhatsapp(raw: string | undefined | null): string {
  let n = (raw || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("0")) n = `234${n.slice(1)}`;
  return n;
}

/**
 * The message the customer sends to the restaurant. Kept plain so it reads
 * well in WhatsApp on any phone.
 */
export function orderMessage(o: OrderSummary): string {
  const L: string[] = [];
  L.push(`NEW ORDER ${orderCode(o.reference)}`);
  L.push(o.restaurantName);
  L.push("");

  L.push("ITEMS");
  for (const line of o.lines) {
    L.push(`${line.qty} x ${line.name} — ${formatNaira(line.amount)}`);
  }
  L.push("");

  L.push(`Subtotal: ${formatNaira(o.subtotal)}`);
  if (o.discount && o.discount > 0) {
    L.push(`Discount${o.couponCode ? ` (${o.couponCode})` : ""}: -${formatNaira(o.discount)}`);
  }
  if (o.fulfilment === "delivery") {
    L.push(`Delivery${o.place ? ` to ${o.place}` : ""}: ${formatNaira(o.deliveryFee || 0)}`);
  } else {
    L.push("Pickup in person");
    if (o.place) L.push(`Pickup at: ${o.place}`);
  }
  L.push(`TOTAL: ${formatNaira(o.total)}`);
  L.push(o.paid ? "Payment: PAID online" : "Payment: to pay on delivery");
  if (o.etaMins) L.push(`Estimated: about ${o.etaMins} minutes`);
  L.push("");

  L.push("CUSTOMER");
  L.push(`Name: ${o.customer.name}`);
  if (o.customer.phone) L.push(`Phone: ${o.customer.phone}`);
  if (o.fulfilment === "delivery" && o.customer.address) {
    L.push(`Address: ${o.customer.address}`);
  }
  if (o.customer.note) L.push(`Note: ${o.customer.note}`);

  return L.join("\n");
}

/** Click-to-chat link that opens WhatsApp with the order pre-filled. */
export function whatsappOrderLink(number: string, o: OrderSummary): string {
  const to = normaliseWhatsapp(number);
  const text = encodeURIComponent(orderMessage(o));
  return to ? `https://wa.me/${to}?text=${text}` : `https://wa.me/?text=${text}`;
}

/** "About 25 to 55 minutes", from prep plus delivery. */
export function etaLabel(
  prepMins: number | undefined,
  deliveryMins: number | undefined,
  fulfilment: "delivery" | "pickup"
): string {
  const prep = Math.max(0, Math.round(prepMins || 0));
  const ride = fulfilment === "delivery" ? Math.max(0, Math.round(deliveryMins || 0)) : 0;
  const total = prep + ride;
  if (!total) return "";
  return fulfilment === "delivery"
    ? `About ${total} minutes to your door`
    : `Ready for pickup in about ${total} minutes`;
}
