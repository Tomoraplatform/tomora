import type { SiteCategory } from "./database.types";

export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com.ng";

/* ---------------- Billing ---------------- */
/** Still written to `sites.trial_ends_at` at signup, as a record. It no longer
 *  takes a site offline: the Free plan replaced the trial (2026-09-11). */
export const TRIAL_DAYS = 14;
/** Fallback amounts for a subscription whose plan cannot be resolved. They
 *  were Pro's first payment and quarterly renewal before Pro became monthly. */
export const FIRST_PAYMENT_AMOUNT = 29800;
export const RENEWAL_AMOUNT = 24800;
export const GRACE_PERIOD_DAYS = 7;
/** Flat price to buy + activate a brand-new domain through Tomora (assisted). */
export const NEW_DOMAIN_AMOUNT = 5550; // NGN base fee, covers .com.ng registration + margin (VAT added on top)

/** Tomora's commission on each storefront sale (0 = owner receives the full payment). */
export const STORE_COMMISSION_PERCENT = 0;
/** Paystack processing fee added to the customer's total when the owner passes it on. */
export const PAYSTACK_FEE_PERCENT = 2.5;

/** Nigerian VAT added on top of Tomora's own charges (subscriptions + domains). */
export const VAT_PERCENT = 7.5;
/** Adds VAT to a naira amount, rounded to the nearest naira. */
export function withVat(amountNaira: number): number {
  return Math.round(amountNaira * (1 + VAT_PERCENT / 100));
}

/** Tomora Wallet withdrawal limits for free / starter / basic plans (naira).
 *  Growth, Pro and Custom plans have no limits. */
export const WALLET_SINGLE_WITHDRAWAL_LIMIT = 5_000;
export const WALLET_DAILY_WITHDRAWAL_LIMIT = 500_000;
/** Plans exempt from wallet withdrawal limits. */
export const WALLET_UNLIMITED_PLANS = ["growth", "pro", "onetime", "custom"];

/** Plans that include staff accounts (team access). */
export const TEAM_PLANS = ["growth", "pro", "onetime", "custom"];
/** Dashboard areas an owner can grant to a staff member. */
export const STAFF_AREAS: { id: string; label: string; description: string }[] = [
  { id: "orders", label: "Orders", description: "View and update customer orders" },
  { id: "products", label: "Products", description: "Add, edit and remove products" },
  { id: "editor", label: "Site content", description: "Edit the website, discounts, shipping and donation figures" },
  { id: "messages", label: "Messages", description: "Read and reply to customer chats" },
  { id: "leads", label: "Leads", description: "View enquiries and form submissions" },
  { id: "reviews", label: "Reviews", description: "Moderate customer reviews" },
];
/**
 * TLDs offered in the assisted domain search. Only .com.ng is cheap enough to
 * sell profitably at the flat NEW_DOMAIN_AMOUNT; pricier TLDs (e.g. .ng, .com)
 * would need per-TLD pricing before being added here.
 */
export const NEW_DOMAIN_TLDS = ["com.ng"] as const;

/* ---------------- Plans ---------------- */
export type PlanId = "free" | "basic" | "starter" | "growth" | "pro" | "onetime" | "custom";

export interface Plan {
  id: PlanId;
  name: string;
  /** First charge amount in NGN (0 for free, null for custom). */
  price: number | null;
  /** Renewal amount in NGN if different from price. */
  renewal?: number;
  /** Billing period label. */
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  popular?: boolean;
  /** How many sites this plan allows in total (incl. the first). */
  siteLimit: number;
  /** Whether publishing live is allowed on this plan. */
  canPublish: boolean;
  includesDomain?: boolean;
  /**
   * Tomora's cut of each online sale or donation, as a percentage of what the
   * merchant is owed (3 means 3%). Paid by the customer on top of their total.
   * This is the default: a row in `plan_fees` overrides it without a redeploy.
   * See lib/platform-fee.ts.
   */
  transactionFeePercent: number;
  /** Flat part of the same fee, in naira, added once per payment. */
  transactionFeeFlat: number;
  /**
   * Whether the store may offer direct bank transfer at checkout. A transfer
   * never passes through Paystack, so no fee can be split from it; plans that
   * charge a fee therefore take card / bank / USSD payments only.
   */
  allowBankTransfer: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    tagline: "Start selling today, no card required.",
    features: [
      "1 website on a Tomora subdomain",
      "Basic templates",
      "Mobile-responsive design",
      "Online checkout & donations with Paystack",
    ],
    cta: "Start Free",
    siteLimit: 1,
    canPublish: true,
    transactionFeePercent: 3,
    transactionFeeFlat: 75,
    allowBankTransfer: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 4900,
    period: "month",
    tagline: "Get your business online, up to 3 websites.",
    features: [
      "Up to 3 published websites",
      "Free Tomora subdomain",
      "Mobile-responsive design",
      "Online store with Paystack checkout",
      "Product & order management",
      "Lead capture with CSV / PDF export",
      "Priority email support",
    ],
    cta: "Choose Starter",
    siteLimit: 3,
    canPublish: true,
    transactionFeePercent: 1.5,
    transactionFeeFlat: 0,
    allowBankTransfer: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: 9800,
    period: "month",
    tagline: "For growing online stores.",
    features: [
      "Everything in Starter",
      "Custom domain included (1 site)",
      "Up to 5 published websites",
      "Inventory & stock management",
      "Customer reviews & ratings",
      "Priority support",
    ],
    cta: "Choose Growth",
    siteLimit: 5,
    canPublish: true,
    includesDomain: true,
    popular: true,
    transactionFeePercent: 0,
    transactionFeeFlat: 0,
    allowBankTransfer: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19800,
    period: "month",
    tagline: "Everything, plus a dedicated expert.",
    features: [
      "Everything in Growth",
      "Custom domain included",
      "Up to 10 published websites",
      "VIP priority support",
      "Dedicated account manager",
      "Early access to new features",
    ],
    cta: "Choose Pro",
    siteLimit: 10,
    canPublish: true,
    includesDomain: true,
    transactionFeePercent: 0,
    transactionFeeFlat: 0,
    allowBankTransfer: true,
  },
  {
    id: "onetime",
    name: "One-Time",
    price: 84500,
    renewal: 20000,
    period: "year",
    tagline: "Pay once for the whole year, everything in Pro.",
    features: [
      "Everything in Pro",
      "One payment covers a full year",
      "1-year custom domain included",
      "Renews at just ₦20,000/year",
      "Covers domain renewal & infrastructure",
      "No monthly deductions",
    ],
    cta: "Pay Once",
    siteLimit: 10,
    canPublish: true,
    includesDomain: true,
    transactionFeePercent: 0,
    transactionFeeFlat: 0,
    allowBankTransfer: true,
  },
  {
    id: "custom",
    name: "Custom",
    price: null,
    period: "tailored",
    tagline: "Built and managed by our experts.",
    features: [
      "Everything in Pro",
      "Custom features & integrations",
      "Built by a Tomora web expert",
      "Ongoing managed service",
      "Priority onboarding",
    ],
    cta: "Talk to us",
    siteLimit: 99,
    canPublish: true,
    includesDomain: true,
    transactionFeePercent: 0,
    transactionFeeFlat: 0,
    allowBankTransfer: true,
  },
];

/**
 * Retired plans kept resolvable so existing subscribers' dashboards and
 * billing keep working. Not shown on pricing pages. "basic" was merged into
 * "starter" (2026-07-17).
 */
const LEGACY_PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic (legacy)",
    price: 4800,
    period: "month",
    tagline: "Get one website online.",
    features: [
      "1 published website",
      "Free Tomora subdomain",
      "Mobile-responsive design",
      "Paystack payment gateway setup",
      "Lead capture with CSV / PDF export",
      "Standard support",
    ],
    cta: "Choose Basic",
    siteLimit: 1,
    canPublish: true,
    transactionFeePercent: 0,
    transactionFeeFlat: 0,
    allowBankTransfer: true,
  },
];

export function getPlan(id: string): Plan | undefined {
  // "trial" was the name of the free tier until the Free plan replaced it
  // (2026-09-11). Anything still holding the old id means the same thing.
  const key = id === "trial" ? "free" : id;
  return PLANS.find((p) => p.id === key) || LEGACY_PLANS.find((p) => p.id === key);
}

/** The plan anyone without an active subscription is on. */
export const FREE_PLAN_ID: PlanId = "free";

/** The minimum plan that allows publishing a paid live site (Growth). */
export const PUBLISH_PLAN: PlanId = "growth";

/* ---------------- Categories ---------------- */
export interface CategoryMeta {
  id: SiteCategory;
  name: string;
  description: string;
  icon: "Building2" | "ShoppingBag" | "User" | "Heart";
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "business",
    name: "Business & Services",
    description: "Agencies, consultants, salons, restaurants and local services.",
    icon: "Building2",
  },
  {
    id: "ecommerce",
    name: "E-commerce & Shop",
    description: "Sell products online and collect payments with Paystack.",
    icon: "ShoppingBag",
  },
  {
    id: "creator",
    name: "Brand & Creator",
    description: "Personal brands, coaches, podcasters and content creators.",
    icon: "User",
  },
  {
    id: "organization",
    name: "Organization & Community",
    description: "NGOs, churches, schools and community institutions.",
    icon: "Heart",
  },
];

/* ---------------- Templates ---------------- */
export interface TemplateMeta {
  id: string;
  name: string;
  category: SiteCategory;
  description: string;
  /** Thumbnail palette for placeholder previews. */
  thumb: { bg: string; accent: string; text: string };
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "clarity",
    name: "Clarity",
    category: "business",
    description: "Light, professional layout for service businesses.",
    thumb: { bg: "#f5f9ff", accent: "#3b82f6", text: "#0f172a" },
  },
  {
    id: "prestige",
    name: "Prestige",
    category: "business",
    description: "Bold and warm with gold accents for premium brands.",
    thumb: { bg: "#1a1a1a", accent: "#d4a23a", text: "#ffffff" },
  },
  {
    id: "luxe",
    name: "Luxe",
    category: "ecommerce",
    description: "Minimal premium storefront in black and white.",
    thumb: { bg: "#ffffff", accent: "#111111", text: "#111111" },
  },
  {
    id: "vivid",
    name: "Vivid",
    category: "ecommerce",
    description: "Energetic warm shop with floating product hero.",
    thumb: { bg: "#fff7e6", accent: "#f97316", text: "#1a1300" },
  },
  {
    id: "editorial",
    name: "Editorial",
    category: "creator",
    description: "Editorial personal brand in terracotta and cream.",
    thumb: { bg: "#f7efe7", accent: "#c75b39", text: "#1a1a1a" },
  },
  {
    id: "studio",
    name: "Studio",
    category: "creator",
    description: "Dark creator style for podcasters and artists.",
    thumb: { bg: "#0d0d0d", accent: "#7c5cff", text: "#ffffff" },
  },
  {
    id: "mission",
    name: "Mission",
    category: "organization",
    description: "Warm nonprofit layout with campaign progress bars.",
    thumb: { bg: "#f3faf7", accent: "#0f9d76", text: "#0c2a22" },
  },
  {
    id: "foundation",
    name: "Foundation",
    category: "organization",
    description: "Institutional deep-blue layout for schools & churches.",
    thumb: { bg: "#0a2540", accent: "#d4a23a", text: "#ffffff" },
  },
];

export function templatesForCategory(category: SiteCategory): TemplateMeta[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplate(id: string): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export const FAQS = [
  {
    q: "Is Tomora free to use?",
    a: "Yes. The Free plan gives you one website on a Tomora subdomain with online checkout and donations, for as long as you like, no credit card required. Upgrade whenever you want more sites, a custom domain or no transaction fee.",
  },
  {
    q: "Can I use my own domain name?",
    a: "Yes. The Growth and Pro plans include a custom domain for your primary site. We give you simple DNS instructions and verify it automatically. On the Starter plan you can add a custom domain for ₦8,000.",
  },
  {
    q: "Are there transaction fees?",
    a: "On the Free and Starter plans Tomora's transaction fee is added to your customer's total at checkout, so it never comes out of your sale or donation. Growth, Pro, One-Time and Custom have no transaction fee. Paystack's own processing fee applies on every plan, as it does today.",
  },
  {
    q: "Does Tomora support Paystack?",
    a: "Yes. Platform billing runs on Paystack, and e-commerce stores collect payments through Paystack straight into the owner's own bank account.",
  },
  {
    q: "Can I sell products on my Tomora website?",
    a: "Absolutely. Choose an E-commerce template, add your products with images and prices in Naira, and buyers check out securely with Paystack.",
  },
  {
    q: "What types of businesses can use Tomora?",
    a: "Small businesses, personal brands, creators, NGOs, churches, schools and coaches, anyone who needs a professional website fast, built for African businesses.",
  },
];
