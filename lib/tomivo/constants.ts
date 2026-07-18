/** Tomora AI Designs ("tomivo") pricing and categories. */

// Headline pricing is shown in USD; the charge goes through Paystack in Naira.
// Update NGN amounts if the exchange rate moves materially.
export const TOMIVO_PLANS = {
  monthly: { id: "monthly", label: "Monthly", usd: 10, ngn: 16000, periodDays: 30, per: "month" },
  yearly: { id: "yearly", label: "Yearly", usd: 100, ngn: 160000, periodDays: 365, per: "year" },
} as const;

export type TomivoPlanId = keyof typeof TOMIVO_PLANS;

export const TOMIVO_CATEGORIES = [
  { id: "all", label: "All designs" },
  { id: "landing-page", label: "Landing pages" },
  { id: "animated-background", label: "Animated backgrounds" },
  { id: "gradient", label: "Gradients" },
] as const;

export const TOMIVO_PERKS = [
  "Preview every design live",
  "Copy the prompt, HTML and CSS",
  "Use them on any platform",
  "New designs every two weeks",
];
