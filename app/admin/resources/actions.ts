"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceFor, CATEGORY_IDS } from "@/lib/resources/constants";

export interface ResourceInput {
  id?: string;
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
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Creates or updates a resource. Price always follows the category. */
export async function saveResource(input: ResourceInput): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const category = CATEGORY_IDS.includes(input.category as never) ? input.category : "section";
  const slug = slugify(input.slug || input.title);
  if (!slug) return { ok: false, error: "Give the resource a title." };

  const row = {
    slug,
    title: input.title.trim(),
    description: input.description.trim(),
    category,
    tags: input.tags.trim(),
    prompt_text: input.prompt_text,
    html_code: input.html_code,
    // Falling back to the resource itself keeps the gallery preview honest.
    preview_html: input.preview_html || input.html_code,
    thumbnail_color: input.thumbnail_color || "#022245",
    is_paid: input.is_paid,
    // The price is never typed in: paid resources cost the category rate.
    price: input.is_paid ? priceFor(category) : 0,
    is_published: input.is_published,
    is_featured: input.is_featured,
    sort_order: Number(input.sort_order) || 0,
  };

  const { error } = input.id
    ? await admin.from("resources").update(row).eq("id", input.id)
    : await admin.from("resources").insert(row);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath(`/resources/${slug}`);
  return { ok: true };
}

/** Flips one boolean flag, re-pricing when the paid switch moves. */
export async function toggleResource(
  id: string,
  field: "is_paid" | "is_published" | "is_featured",
  value: boolean
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const patch: Record<string, unknown> = { [field]: value };
  if (field === "is_paid") {
    const { data } = await admin.from("resources").select("category").eq("id", id).maybeSingle();
    patch.price = value ? priceFor((data?.category as string) || "section") : 0;
  }

  const { error } = await admin.from("resources").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  return { ok: true };
}

export async function deleteResource(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("resources").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  return { ok: true };
}
