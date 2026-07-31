import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string;
  prompt_text: string;
  html_code: string;
  preview_html: string;
  thumbnail_color: string;
  is_paid: boolean;
  price: number;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  views: number;
  copies: number;
  downloads: number;
  created_at: string;
}

/**
 * What the public pages are allowed to see. The prompt and the HTML are
 * deliberately absent: they are only ever served by the API, and only after
 * the resource is proven free or paid for.
 */
export type ResourceCard = Omit<Resource, "prompt_text" | "html_code">;

const CARD_COLS =
  "id, slug, title, description, category, tags, preview_html, thumbnail_color, " +
  "is_paid, price, is_published, is_featured, sort_order, views, copies, downloads, created_at";

/** Published resources for the public library, featured first. */
export async function listPublishedResources(): Promise<ResourceCard[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("resources")
    .select(CARD_COLS)
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .order("created_at");
  return (data as unknown as ResourceCard[]) || [];
}

/** Every resource, for the admin table. */
export async function listAllResources(): Promise<Resource[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("resources").select("*").order("sort_order").order("created_at");
  return (data as Resource[]) || [];
}

/** Public-safe lookup by slug. */
export async function getResourceCard(slug: string): Promise<ResourceCard | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("resources").select(CARD_COLS).eq("slug", slug).maybeSingle();
  return (data as unknown as ResourceCard) || null;
}

/** Full row including the gated columns. Server use only, never sent as-is. */
export async function getResource(idOrSlug: string): Promise<Resource | null> {
  const admin = createAdminClient();
  const col = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(idOrSlug) ? "id" : "slug";
  const { data } = await admin.from("resources").select("*").eq(col, idOrSlug).maybeSingle();
  return (data as Resource) || null;
}

/**
 * True when this email has paid for this resource. Free resources are open to
 * everyone, so callers should check `is_paid` first.
 */
export async function hasPurchased(resourceId: string, email: string): Promise<boolean> {
  if (!email) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("resource_purchases")
    .select("id")
    .eq("resource_id", resourceId)
    .eq("status", "paid")
    .ilike("email", email)
    .maybeSingle();
  return !!data;
}

/** Every resource this email has unlocked, so the library can mark them owned. */
export async function purchasedIds(email: string): Promise<string[]> {
  if (!email) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("resource_purchases")
    .select("resource_id")
    .eq("status", "paid")
    .ilike("email", email);
  return (data || []).map((r: { resource_id: string }) => r.resource_id);
}

type Counter = "views" | "copies" | "downloads";

/** Best-effort usage counter; never fails a request. */
export async function bumpCounter(id: string, column: Counter): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin.from("resources").select(column).eq("id", id).maybeSingle();
  if (!data) return;
  await admin
    .from("resources")
    .update({ [column]: ((data as Record<string, number>)[column] || 0) + 1 })
    .eq("id", id);
}
