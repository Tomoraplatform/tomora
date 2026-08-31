/**
 * Database types for Tomora. Hand-maintained to mirror the SQL schema in
 * supabase/migrations. Regenerate with `supabase gen types` once connected
 * to a live project if you prefer.
 */

import type { Coupon } from "./coupons";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  tiktok?: string;
  website?: string;
  [key: string]: string | undefined;
}

export type SiteCategory =
  | "business"
  | "ecommerce"
  | "creator"
  | "organization";

export type DomainStatus =
  | "none"
  | "pending"
  | "verifying"
  | "active"
  | "failed";

export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "none";

export type OrderStatus = "pending" | "paid" | "packed" | "shipped" | "delivered";

export interface Profile {
  id: string;
  user_id: string;
  business_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  social_links: SocialLinks | null;
  is_admin: boolean;
  created_at: string;
}

export interface Site {
  id: string;
  user_id: string;
  template_id: string;
  category: SiteCategory;
  subdomain: string;
  custom_domain: string | null;
  domain_status: DomainStatus;
  is_live: boolean;
  trial_ends_at: string | null;
  site_data: SiteData;
  paystack_public_key: string | null;
  bank_name: string | null;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  paystack_subaccount: string | null;
  domain_purchased: boolean;
  /** A sandbox demo store: shows demo stock, takes no real money, never counts
   *  towards a plan's site limit. See lib/sandbox.ts. */
  is_demo?: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  paystack_subscription_code: string | null;
  status: SubscriptionStatus;
  billing_cycle_position: number; // 0-3
  first_payment_amount: number;
  renewal_amount: number;
  next_billing_date: string | null;
  last_payment_date: string | null;
  last_reference: string | null;
  plan: string | null;
  comp_expires_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  site_id: string;
  product_id: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  comment: string | null;
  is_published: boolean;
  verified_purchase: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  site_id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  images: string[];
  category: string | null;
  stock: number;
  is_active: boolean;
  is_best_seller: boolean;
  is_offer: boolean;
  is_new_arrival: boolean;
  offer_percent: number;
  colors: string[];
  color_variants: ColorVariant[];
  /** Sizes this product is sold in, each with its own size guide image.
   *  Empty for products that are not sold by size. */
  sizes?: SizeVariant[];
  is_pre_order: boolean;
  preorder_note: string | null;
  created_at: string;
}

export interface ColorVariant {
  name: string;
  image?: string;
}

export interface SizeVariant {
  name: string;
  /** Chart shown when a shopper checks the guide for this size. */
  guide?: string;
}

export interface Order {
  id: string;
  site_id: string;
  product_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_address: string | null;
  amount: number;
  color: string | null;
  paystack_reference: string | null;
  status: OrderStatus;
  seen: boolean;
  created_at: string;
}

export interface Domain {
  id: string;
  user_id: string;
  site_id: string;
  domain_name: string;
  registrar_reference: string | null;
  status: DomainStatus;
  expires_at: string | null;
  created_at: string;
}

/* ---- site_data shape (stored in sites.site_data jsonb) ---- */

export interface SiteBlock {
  id: string;
  type: string; // hero | stats | services | about | testimonials | products | cta | contact | footer
  enabled: boolean;
  content: Record<string, Json>;
}

/* ---- v2 template content shapes ---- */
export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  image: string;
  rating?: number;
  reviews?: number;
  category?: string;
  bestSeller?: boolean;
  offer?: boolean;
  newArrival?: boolean;
  offerPercent?: number;
  colors?: string[];
  colorVariants?: ColorVariant[];
  isPreOrder?: boolean;
  preorderNote?: string;
}
export interface CatalogCourse {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: string;
  rating?: number;
  image: string;
  /** External link the course's button opens (e.g. enrolment / detail page). */
  linkUrl?: string;
}
export interface CatalogCause {
  id: string;
  title: string;
  description: string;
  image: string;
  raised: number;
  goal: number;
}
export interface CatalogEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  description?: string;
  /** Optional external link for the item's "Read More" button. */
  linkUrl?: string;
}
export interface CatalogPortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description?: string;
  /** Optional external link for the item's button (templates that show one). */
  linkUrl?: string;
}
export interface CatalogDonationProject {
  id: string;
  name: string;
  description?: string;
  /** Fundraising target for this project, in naira. */
  goal: number;
  /** Optional card image shown above the project's details. */
  image?: string;
  /**
   * Funds this project received off-platform (cash, direct bank transfer, etc.),
   * entered by the owner. Added to online gifts for the progress bar only, it
   * never touches the Tomora wallet.
   */
  manualRaised?: number;
  /**
   * How many gifts that offline amount represents. Without it, recording cash
   * moves the money and the progress bar while the "N gifts" line underneath
   * stays put, which reads as a counter that has stopped working.
   */
  manualCount?: number;
}
export interface CatalogResultItem {
  id: string;
  /** Optional caption, e.g. a client or project name. */
  title?: string;
  beforeImage?: string;
  afterImage?: string;
  /** Free text, e.g. "+150%", "3.2x", "₦2.4M". The leading number animates in on scroll. */
  statValue: string;
  /** What the stat measures, e.g. "Increase in monthly bookings". */
  statLabel: string;
}

export interface SiteData {
  businessName: string;
  tagline?: string;
  logoUrl?: string;
  /** Footer credit text (defaults to "Built with Tomora"; empty string hides it). */
  footerCredit?: string;
  /** Custom browser-tab favicon URL (paid plans only). */
  faviconUrl?: string;
  brandColor: string;
  brandColorSecondary?: string;
  phone?: string;
  email?: string;
  address?: string;
  social?: SocialLinks;
  blocks: SiteBlock[];

  // v2 template fields (optional, populated by the catalog content generator)
  heroHeadline?: string;
  heroSubtext?: string;
  heroImage?: string;
  /** Extra hero images for templates whose hero shows more than one image. */
  heroImages?: string[];
  ctaText?: string;
  ctaHref?: string;
  contactForm?: boolean;
  /** Custom brand color hex codes the user saved (max 3). First is primary. */
  brandColors?: string[];
  /** Editable navigation-bar links (label + target anchor/URL). */
  navLinks?: { id: string; label: string; target: string }[];
  /** Per-template editable section headings, keyed by section id. */
  sectionTitles?: Record<string, string>;
  /** Per-template editable section intro text, keyed by section id. */
  sectionText?: Record<string, string>;
  /** Per-template editable section images, keyed by section id. */
  sectionImages?: Record<string, string>;
  /** Optional owner/intro video link shown in the hero of some templates. */
  heroVideoUrl?: string;
  /** Hero overlay color over the background image (templates with an overlay). */
  heroOverlayColor?: string;
  /** Secondary hero "Get Ticket" button text + link. */
  ticketText?: string;
  ticketUrl?: string;
  /** Toggle the search bar on event templates (default on). */
  showSearch?: boolean;
  /** Editable search-bar field placeholders + button text. */
  searchPlaceholders?: string[];
  searchButtonText?: string;
  /** Per-section editable eyebrow / kicker label, keyed by section key. */
  sectionEyebrows?: Record<string, string>;
  /** Per-section editable button (text + link), keyed by section key. */
  sectionButtons?: Record<string, { text?: string; url?: string }>;
  /** Per-section editable background color, keyed by section key. */
  sectionColors?: Record<string, string>;
  /** Highlighted hero stat (e.g. donation total) for charity-style heroes. */
  heroStatLabel?: string;
  heroStatValue?: string;
  /** Editable impact / gallery images (charity templates). */
  impactImages?: CatalogCategoryItem[];
  /** Hero avatar/icon images (e.g. "120+ happy volunteers" row). */
  heroAvatars?: CatalogCategoryItem[];
  /** Editable quick-action cards (title + description). */
  quickActions?: CatalogServiceItem[];
  /** Editable About-section image grid. */
  aboutImages?: CatalogCategoryItem[];
  /** Editable About-section points (e.g. Mission / Vision). */
  aboutPoints?: CatalogServiceItem[];
  /** Editable ministry / feature tiles (image + label). */
  ministries?: CatalogCategoryItem[];
  /** Countdown banner: label + target date (ISO). Active only when a date is set. */
  countdownLabel?: string;
  countdownDate?: string;
  /** Donations (organisation/community sites): live fundraising section. */
  donationEnabled?: boolean;
  donationGoal?: number;   // target amount in naira
  /** When the owner last restarted their "received so far" total. */
  walletResetAt?: string;
  donationManual?: number; // offline / manually-added amount in naira
  /** How many gifts the offline amount represents, so the "N gifts" line
   *  moves whenever the amount above it does. */
  donationManualCount?: number;
  /** Section keys the owner deleted from their page (restorable in the editor). */
  hiddenSections?: string[];
  /** Named fundraising projects, each with its own target + progress bar. When set,
   *  the donation section shows a card per project instead of one general goal;
   *  every gift still settles to the same payout account. */
  donationProjects?: CatalogDonationProject[];
  /** Progress / skill bars (label + percentage) for "Why us" style sections. */
  progress?: CatalogProgress[];
  /** Toggle the newsletter signup form on storefront templates (default on). */
  showNewsletter?: boolean;
  /** Custom order of the template's built-in sections (keys); missing = natural order. */
  sectionOrder?: string[];
  /** User-added custom sections, rendered before the footer on any template. */
  customSections?: CustomSection[];
  testimonials?: CatalogTestimonial[];
  services?: CatalogServiceItem[];
  /** Education template: editable category row (name + optional icon image). */
  eduCategories?: CatalogCategoryItem[];
  /** Education template: editable "advantages" list (title + description). */
  advantages?: CatalogServiceItem[];
  /** Education template: editable career-support "features" list. */
  eduFeatures?: CatalogServiceItem[];
  resume?: CatalogResumeItem[];
  faqs?: CatalogFaq[];
  stats?: CatalogStat[];
  shopCategories?: CatalogCategoryItem[];
  /** Editable client / partner logos (image + optional name). */
  clientLogos?: CatalogCategoryItem[];
  /** Booking / scheduling link (Calendly, WhatsApp, etc.) for the "Book me" section. */
  bookingUrl?: string;
  /** Uploaded CV/resume file (PDF/DOC) made downloadable from the hero. */
  cvUrl?: string;
  trustBadges?: CatalogTrustBadge[];
  hours?: CatalogHour[];
  products?: CatalogProduct[];
  courses?: CatalogCourse[];
  causes?: CatalogCause[];
  events?: CatalogEvent[];
  portfolioItems?: CatalogPortfolioItem[];
  /** Creator template: before/after results, image pair + animated up-counting stat. */
  beforeAfterResults?: CatalogResultItem[];
  /** Creator template: editable single-line skills list. */
  skills?: CatalogCategoryItem[];
  /** Creator template: overlapping "Experience" photos (image only). */
  experiencePhotos?: CatalogCategoryItem[];
  /** Creator template: photo gallery (image + optional caption). */
  galleryPhotos?: CatalogCategoryItem[];
  /** Creator template: video gallery, each item is an uploaded video (+ optional poster/title). */
  galleryVideos?: CatalogVideoItem[];
  /** Shop template: editable "recent blog posts" cards. */
  blogPosts?: CatalogBlogPost[];
  /** Creator template: videos added by link (YouTube/Vimeo), not uploaded. */
  videoLinks?: CatalogVideoLink[];
  /** Owner-set targets shown on the Milestones & Goals dashboard. */
  goals?: { orders?: number; revenue?: number; visits?: number };
  /** Store discount codes / coupons applied at checkout. */
  coupons?: Coupon[];
  /** Shipping locations + fees a customer chooses from at checkout. */
  shippingZones?: { id: string; name: string; fee: number }[];
  /** Which checkout payment methods the owner has enabled. */
  paymentMethods?: { paystack?: boolean; transfer?: boolean };
  /** Who covers the Paystack processing fee, added to the customer's total when "customer". */
  feeBearer?: "customer" | "owner";
  /** Restaurant template: hours, pickup and the WhatsApp order number. */
  restaurant?: import("./restaurant/types").RestaurantSettings;
  /** Restaurant template: fixed-price meal bundles. Top-level so the site
   *  editor's list panel can edit them; older sites keep them under
   *  `restaurant.combos`, so read them with `combosOf`. */
  combos?: import("./restaurant/types").Combo[];
  /** Restaurant template: products the owner allocated to the Combos section.
   *  These show as combos and are left out of the menu, since a combo is not a
   *  menu item. Set from the "Combo" switch on the product card. */
  comboProductIds?: string[];
}

export interface CatalogVideoLink {
  id: string;
  title?: string;
  /** YouTube / Vimeo (or any) video URL. Embedded when recognised. */
  url?: string;
}

export interface CatalogBlogPost {
  id: string;
  title: string;
  excerpt?: string;
  date?: string;
  image?: string;
  linkUrl?: string;
}

export interface CatalogVideoItem {
  id: string;
  title?: string;
  /** Uploaded video URL (mp4/webm). Empty until the owner uploads one. */
  video?: string;
  /** Optional poster image shown before playback / when no video is set. */
  thumbnail?: string;
}

export interface CatalogTestimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  image?: string;
}

export interface CatalogServiceItem {
  id: string;
  title: string;
  description?: string;
  /** Optional external link for the item's button (templates that show one). */
  linkUrl?: string;
}

export interface CatalogResumeItem {
  id: string;
  group: string;   // tab, e.g. Education / Experience
  title: string;   // date range or skill area
  subtitle: string; // institution / role
  detail?: string;  // qualification / note
}

export interface CatalogFaq {
  id: string;
  question: string;
  answer: string;
}

export interface CatalogCategoryItem {
  id: string;
  name: string;
  image?: string;
}

export interface CatalogTrustBadge {
  id: string;
  title: string;
  subtitle?: string;
}

export interface CatalogStat {
  id: string;
  value: string;
  label: string;
}

export interface CatalogProgress {
  id: string;
  label: string;
  value: number; // percentage 0-100
}

export interface CatalogHour {
  id: string;
  label: string; // e.g. Sunday, Weekdays
  time: string;  // e.g. 9:00 AM
}

export interface Lead {
  id: string;
  site_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  site_id: string;
  conversation_id: string;
  sender: "visitor" | "owner";
  name: string | null;
  email: string | null;
  body: string;
  seen: boolean;
  created_at: string;
}

/* ---- User-added custom sections (page builder) ---- */
export type CustomSectionType =
  | "text"          // headline + description
  | "image_text"    // image and text side by side
  | "image_overlay" // background image with overlay + text
  | "cards"         // section with cards
  | "products"      // products with pricing
  | "button"        // a call-to-action button
  | "video"         // a video (uploaded, ≤10MB)
  | "video_text"    // video and text side by side
  | "video_bg";     // video as background with text on top

export interface CustomSectionCard {
  id: string;
  image?: string;
  title: string;
  body?: string;
}

export interface CustomSectionProduct {
  id: string;
  image?: string;
  name: string;
  price?: string;
  buttonText?: string;
  buttonHref?: string;
}

export interface CustomSection {
  id: string;
  type: CustomSectionType;
  /** Where on the page this section renders: just below the hero, or above the footer. */
  placement?: "top" | "bottom";
  headline?: string;
  body?: string;
  image?: string;
  imageSide?: "left" | "right";
  videoUrl?: string;
  buttonText?: string;
  buttonHref?: string;
  align?: "left" | "center";
  cards?: CustomSectionCard[];
  products?: CustomSectionProduct[];
}

export type DomainRequestStatus = "paid" | "registered" | "connected" | "cancelled";

export interface DomainRequest {
  id: string;
  site_id: string;
  user_id: string;
  domain: string;
  amount: number;
  reference: string | null;
  status: DomainRequestStatus;
  created_at: string;
}
