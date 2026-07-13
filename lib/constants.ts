import type { SiteCategory } from "./database.types";

export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com.ng";

/* ---------------- Billing ---------------- */
export const TRIAL_DAYS = 14;
export const FIRST_PAYMENT_AMOUNT = 29800; // NGN — Pro first payment, includes 1yr custom domain
export const RENEWAL_AMOUNT = 24800; // NGN — Pro renewals at positions 1,2,3
export const RENEWAL_INTERVAL_MONTHS = 3;
export const GRACE_PERIOD_DAYS = 7;
/** Flat price to buy + activate a brand-new domain through Tomora (assisted). */
export const NEW_DOMAIN_AMOUNT = 5000; // NGN — covers .com.ng registration (~₦2,500–3,500) + margin

/** Tomora's commission on each storefront sale (0 = owner receives the full payment). */
export const STORE_COMMISSION_PERCENT = 0;
/** Paystack processing fee added to the customer's total when the owner passes it on. */
export const PAYSTACK_FEE_PERCENT = 2.5;

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

/**
 * Given the current billing_cycle_position (0-3), returns the amount to charge
 * for the NEXT payment and the position it will become afterwards.
 *  - position 0  -> charge 29,800 (first payment / reset), becomes 1
 *  - position 1,2 -> charge 24,800, becomes +1
 *  - position 3  -> charge 24,800, becomes 0 (cycle resets)
 */
export function nextCharge(position: number): {
  amount: number;
  nextPosition: number;
  includesDomain: boolean;
} {
  if (position <= 0) {
    return { amount: FIRST_PAYMENT_AMOUNT, nextPosition: 1, includesDomain: true };
  }
  if (position >= 3) {
    return { amount: RENEWAL_AMOUNT, nextPosition: 0, includesDomain: false };
  }
  return { amount: RENEWAL_AMOUNT, nextPosition: position + 1, includesDomain: false };
}

/* ---------------- Plans ---------------- */
export type PlanId = "trial" | "basic" | "starter" | "growth" | "pro" | "onetime" | "custom";

export interface Plan {
  id: PlanId;
  name: string;
  /** First charge amount in NGN (0 for trial, null for custom). */
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
}

export const PLANS: Plan[] = [
  {
    id: "trial",
    name: "Free Trial",
    price: 0,
    period: "14 days",
    tagline: "Build and preview — no credit card.",
    features: [
      "14 days free",
      "1 website on a Tomora subdomain",
      "All 14 templates",
      "Mobile-responsive design",
      "No credit card required",
    ],
    cta: "Start Free Trial",
    siteLimit: 1,
    canPublish: true,
  },
  {
    id: "basic",
    name: "Basic",
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
  },
  {
    id: "starter",
    name: "Starter",
    price: 9800,
    period: "month",
    tagline: "Build and publish up to 3 websites.",
    features: [
      "Everything in Basic",
      "Up to 3 published websites",
      "Online store with Paystack checkout",
      "Product & order management",
      "Priority email support",
    ],
    cta: "Choose Starter",
    siteLimit: 3,
    canPublish: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: 14800,
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
  },
  {
    id: "pro",
    name: "Pro",
    price: 29800,
    renewal: 24800,
    period: "3 months",
    tagline: "Everything, plus a dedicated expert.",
    features: [
      "Everything in Growth",
      "1-year custom domain included",
      "Up to 10 published websites",
      "VIP priority support",
      "Dedicated account manager",
      "Early access to new features",
    ],
    cta: "Choose Pro",
    siteLimit: 10,
    canPublish: true,
    includesDomain: true,
  },
  {
    id: "onetime",
    name: "One-Time",
    price: 84500,
    renewal: 20000,
    period: "year",
    tagline: "Pay once for the whole year — everything in Pro.",
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
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

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
    a: "Yes. You can build and publish your website on a free 14-day trial with a Tomora subdomain — no credit card required. Upgrade to Pro whenever you're ready for a custom domain and e-commerce.",
  },
  {
    q: "Can I use my own domain name?",
    a: "Yes. The Growth and Pro plans include a custom domain for your primary site. We give you simple DNS instructions and verify it automatically. On the Basic and Starter plans you can add a custom domain for ₦8,000.",
  },
  {
    q: "What happens when my trial ends?",
    a: "After 14 days your site goes offline with an upgrade prompt. Upgrade to Pro and it goes live again instantly on your subdomain or custom domain.",
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
    a: "Small businesses, personal brands, creators, NGOs, churches, schools and coaches — anyone who needs a professional website fast, built for African businesses.",
  },
];
