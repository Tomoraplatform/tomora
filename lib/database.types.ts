/**
 * Database types for Tomora. Hand-maintained to mirror the SQL schema in
 * supabase/migrations. Regenerate with `supabase gen types` once connected
 * to a live project if you prefer.
 */

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

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered";

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
  account_number: string | null;
  account_name: string | null;
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
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  site_id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  category: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
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
  paystack_reference: string | null;
  status: OrderStatus;
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
  price: number;
  comparePrice?: number;
  image: string;
  rating?: number;
  reviews?: number;
  category?: string;
}
export interface CatalogCourse {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: string;
  rating?: number;
  image: string;
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
}
export interface CatalogPortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description?: string;
}

export interface SiteData {
  businessName: string;
  tagline?: string;
  logoUrl?: string;
  brandColor: string;
  brandColorSecondary?: string;
  phone?: string;
  email?: string;
  address?: string;
  social?: SocialLinks;
  blocks: SiteBlock[];

  // v2 template fields (optional — populated by the catalog content generator)
  heroHeadline?: string;
  heroSubtext?: string;
  heroImage?: string;
  ctaText?: string;
  ctaHref?: string;
  contactForm?: boolean;
  /** Custom brand color hex codes the user saved (max 3). First is primary. */
  brandColors?: string[];
  testimonials?: CatalogTestimonial[];
  services?: CatalogServiceItem[];
  products?: CatalogProduct[];
  courses?: CatalogCourse[];
  causes?: CatalogCause[];
  events?: CatalogEvent[];
  portfolioItems?: CatalogPortfolioItem[];
}

export interface CatalogTestimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
}

export interface CatalogServiceItem {
  id: string;
  title: string;
  description?: string;
}
