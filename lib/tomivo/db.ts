import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TomivoDesign {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string;
  prompt_text: string;
  html_code: string;
  css_code: string;
  preview_html: string;
  thumbnail_color: string;
  is_featured: boolean;
  is_premium: boolean;
  is_published: boolean;
  sort_order: number;
  views: number;
  copies: number;
  created_at: string;
}

/** Card shape sent to the public gallery — never includes the gated code/prompt. */
export type TomivoDesignCard = Omit<TomivoDesign, "prompt_text" | "html_code" | "css_code">;

const CARD_COLS = "id, title, slug, description, category, tags, preview_html, thumbnail_color, is_featured, is_premium, is_published, sort_order, views, copies, created_at";

/** Published designs for the public gallery (no code/prompt). Featured first, then sort_order. */
export async function listPublishedDesigns(): Promise<TomivoDesignCard[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("tomivo_designs").select(CARD_COLS)
    .eq("is_published", true).order("is_featured", { ascending: false }).order("sort_order").order("created_at");
  return (data as TomivoDesignCard[]) || [];
}

/** Every design, admin view. */
export async function listAllDesigns(): Promise<TomivoDesign[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("tomivo_designs").select("*").order("sort_order").order("created_at");
  return (data as TomivoDesign[]) || [];
}

export async function getDesign(idOrSlug: string): Promise<TomivoDesign | null> {
  const admin = createAdminClient();
  const col = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(idOrSlug) ? "id" : "slug";
  const { data } = await admin.from("tomivo_designs").select("*").eq(col, idOrSlug).maybeSingle();
  return (data as TomivoDesign) || null;
}

/** True when the student has a non-expired subscription. */
export async function hasActiveSubscription(studentId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from("tomivo_subscriptions")
    .select("current_period_end").eq("student_id", studentId).maybeSingle();
  return !!data && new Date(data.current_period_end) > new Date();
}

export async function incrementCopies(designId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin.from("tomivo_designs").select("copies").eq("id", designId).maybeSingle();
  if (data) await admin.from("tomivo_designs").update({ copies: (data.copies || 0) + 1 }).eq("id", designId);
}
