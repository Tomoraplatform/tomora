import type { SiteCategory } from "./database.types";

export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com";

/* ---------------- Billing ---------------- */
export const TRIAL_DAYS = 14;
export const FIRST_PAYMENT_AMOUNT = 30000; // NGN — Pro first payment, includes 1yr custom domain
export const RENEWAL_AMOUNT = 25000; // NGN — Pro renewals at positions 1,2,3
export const RENEWAL_INTERVAL_MONTHS = 4;
export const GRACE_PERIOD_DAYS = 7;
export const EXTRA_DOMAIN_AMOUNT = 8000; // NGN — buy a custom domain for an extra site

/**
 * Given the current billing_cycle_position (0-3), returns the amount to charge
 * for the NEXT payment and the position it will become afterwards.
 *  - position 0  -> charge 30,000 (first payment / reset), becomes 1
 *  - position 1,2 -> charge 22,500, becomes +1
 *  - position 3  -> charge 22,500, becomes 0 (cycle resets)
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
export type PlanId = "trial" | "starter" | "growth" | "pro" | "custom";

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
      "Free Tomora subdomain",
      "All 14 templates",
      "Build & preview your site",
      "No credit card required",
    ],
    cta: "Start Free Trial",
    siteLimit: 1,
    canPublish: true,
  },
  {
    id: "starter",
    name: "Starter",
    price: 10000,
    period: "month",
    tagline: "Get online with the essentials.",
    features: [
      "Free Tomora subdomain",
      "Payment gateway setup",
      "We set up your website",
      "Mobile-friendly interface",
      "Standard support",
    ],
    cta: "Choose Starter",
    siteLimit: 2,
    canPublish: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: 15000,
    period: "month",
    tagline: "For growing online stores.",
    features: [
      "Custom domain name included",
      "Abandoned cart recovery",
      "Unlimited orders",
      "We set up your website",
      "Payment gateway setup",
      "Inventory management",
    ],
    cta: "Choose Growth",
    siteLimit: 2,
    canPublish: true,
    includesDomain: true,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 30000,
    renewal: 25000,
    period: "4 months",
    tagline: "Everything, plus a dedicated expert.",
    features: [
      "1 year custom domain included",
      "Everything in Growth",
      "VIP priority support",
      "Advanced sales analytics",
      "Dedicated account manager",
      "Automated invoicing",
    ],
    cta: "Choose Pro",
    siteLimit: 3,
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
    a: "Yes. On the Pro plan your first payment of N30,000 includes one year of a custom domain. We give you simple DNS instructions and verify it automatically.",
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
