/**
 * Who has gone quiet, and what to say to them.
 *
 * Pure and client-safe: the admin screen filters and previews with exactly the
 * rules the send uses, so what is on screen is what goes out.
 */

/**
 * How many people one send may go to. A young sending domain that fires off
 * hundreds of messages at once is what a spam filter watches for, and a
 * mis-click should not be able to mail the whole database.
 */
export const MAX_PER_SEND = 100;

/** How far someone got before they stopped. */
export type Stage = "no_site" | "unpublished" | "no_payouts" | "no_products" | "no_sales" | "active";

export const STAGE_LABEL: Record<Stage, string> = {
  no_site: "Signed up, no website",
  unpublished: "Website built, never published",
  no_payouts: "Live, but cannot be paid",
  no_products: "Store live, no products",
  no_sales: "Live, no sales yet",
  active: "Active",
};

export interface UserFacts {
  createdAt: string;
  hasSite: boolean;
  isLive: boolean;
  isStore: boolean;
  /** A Paystack payout account is connected, so the site can be paid. */
  hasPayout: boolean;
  productCount: number;
  paidOrderCount: number;
  subscriptionActive: boolean;
  /** Last time Tomora emailed them from here, if ever. */
  lastContactedAt?: string | null;
  optedOut?: boolean;
  email?: string | null;
}

export function stageOf(u: UserFacts): Stage {
  if (u.subscriptionActive || u.paidOrderCount > 0) return "active";
  if (!u.hasSite) return "no_site";
  if (!u.isLive) return "unpublished";
  // A live site with no payout bank can take nothing: cards need one, and on
  // the Free plan there is no bank transfer to fall back on. That beats a
  // missing product, because adding products to a shop nobody can pay at
  // changes nothing.
  if (!u.hasPayout) return "no_payouts";
  if (u.isStore && u.productCount === 0) return "no_products";
  return "no_sales";
}

/** Whole days since a date, or null when there isn't one. */
export function daysSince(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((now - t) / 86_400_000);
}

export interface Filters {
  stages: Stage[];
  /** Only people who signed up at least this many days ago. */
  minAgeDays: number;
  /** Skip anyone emailed from here within this many days. 0 = don't skip. */
  quietDays: number;
}

/**
 * Whether someone should be on the list. Opted-out people and people with no
 * address are never included, whatever the filters say.
 */
export function isSelectable(u: UserFacts, f: Filters, now = Date.now()): boolean {
  if (u.optedOut || !u.email) return false;
  if (!f.stages.includes(stageOf(u))) return false;
  const age = daysSince(u.createdAt, now);
  if (age == null || age < f.minAgeDays) return false;
  if (f.quietDays > 0) {
    const since = daysSince(u.lastContactedAt, now);
    if (since != null && since < f.quietDays) return false;
  }
  return true;
}

/** The name to greet someone by: their business, else the part before the @. */
export function greetingName(businessName?: string | null, email?: string | null): string {
  const b = (businessName || "").trim();
  if (b) return b;
  const local = (email || "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return local || "there";
}

export interface TemplateVars {
  name: string;
  site: string;
  dashboard: string;
  booking: string;
}

/**
 * Fills {{name}}, {{site}}, {{dashboard}} and {{booking}} in a message.
 * An unknown placeholder is left alone rather than blanked, so a typo shows up
 * in the preview instead of going out as a hole in the sentence.
 */
export function renderTemplate(body: string, vars: TemplateVars): string {
  const table: Record<string, string> = {
    name: vars.name, site: vars.site, dashboard: vars.dashboard, booking: vars.booking,
  };
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, key: string) =>
    key in table ? table[key] : whole);
}

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

/** Starting points, editable before sending. */
export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: "setup_call",
    name: "Offer to set the site up for them",
    subject: "Want us to set up your Tomora website for you?",
    body: `Hi {{name}},

You started a website on Tomora but haven't taken it live yet. If you'd like, we can set it up for you: your logo and colours, your products or your cause, and a payment account so you can start taking money.

It takes about 30 minutes together. Pick a time here and we'll do it with you: {{booking}}

If you'd rather carry on yourself, your site is waiting at {{dashboard}} and you can reply to this email with any question.

— The Tomora team`,
  },
  {
    id: "connect_payouts",
    name: "Ask them to connect their bank",
    subject: "Your Tomora site can't take payments yet",
    body: `Hi {{name}},

Your site at {{site}} is live, but you haven't connected a bank account yet, so there is nowhere for your customers' money to go. Anyone who tries to pay you today cannot.

It takes two minutes: open {{dashboard}}, go to Payouts, and enter your bank and account number. Payments then go straight into your own account, not to Tomora.

If you'd rather we did it with you, pick a time here: {{booking}}

— The Tomora team`,
  },
  {
    id: "finish_site",
    name: "Nudge to publish",
    subject: "Your Tomora website is one step from going live",
    body: `Hi {{name}},

Your website is built but it isn't published yet, so nobody can visit it.

Open {{dashboard}}, press Publish, and it goes live at {{site}} straight away. The Free plan keeps it online for as long as you like.

Stuck on anything? Reply to this email and a person will answer.

— The Tomora team`,
  },
  {
    id: "add_products",
    name: "Nudge to add products",
    subject: "Add your first product and start selling",
    body: `Hi {{name}},

Your store is live at {{site}} but it has no products yet, so there's nothing for a visitor to buy.

Add one at {{dashboard}}: a photo, a name and a price is enough. Customers can then pay you by card, bank or USSD, straight into your bank account.

Want us to add your first few products with you? Book a time here: {{booking}}

— The Tomora team`,
  },
];
