export const COURSE_NAME = "Make Extra Income with Claude AI";

export const COURSE_PROMISE =
  "Create a clean online presence for your brand and learn how to monetize it.";

export const COURSE_LONG_PROMISE =
  "A premium, beginner-friendly mini-course that walks you through building a clean online presence for your brand and turning it into extra income — step by step.";

/**
 * Pricing — single source of truth for what is displayed AND charged.
 * ₦9,999 current · ₦45,000 original (slashed). Paystack is charged in kobo:
 * 9,999 × 100 = 999,900.
 */
export const COURSE_PRICE_NAIRA = 9999;
export const COURSE_ORIGINAL_PRICE_NAIRA = 45000;
export const COURSE_PRICE_KOBO = COURSE_PRICE_NAIRA * 100; // 999900

/** Right-side hero banner image (saved to /public/images/course-banner.png). */
export const COURSE_BANNER_IMAGE = "/images/course-banner.png";

export const SUPPORT_FALLBACK_EMAIL = "tommyconcept4@gmail.com";

export const UNAPPROVED_MESSAGE =
  "We could not find this email on the approved student list. Please use the email you paid with or contact support.";

export const MODULE_LOCK_MESSAGE =
  "We recommend completing the previous module first so you get the best result from this course.";

/** app_settings keys */
export const SETTINGS = {
  whatsappLink: "whatsapp_community_link",
  feedbackEmail: "feedback_recipient_email",
  coursePrice: "course_price",
  currency: "currency",
  supportEmail: "support_email",
} as const;

export type ModuleStatus = "Not Started" | "In Progress" | "Completed";
