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

export interface SiteData {
  businessName: string;
  tagline?: string;
  logoUrl?: string;
  brandColor: string;
  phone?: string;
  email?: string;
  address?: string;
  social?: SocialLinks;
  blocks: SiteBlock[];
}
