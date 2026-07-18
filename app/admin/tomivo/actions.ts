"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

async function guard() {
  if (!(await isAdmin())) throw new Error("Forbidden");
  return createAdminClient();
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "design";
}

type R = { ok: boolean; error?: string; id?: string };

export async function createDesign(): Promise<R> {
  try {
    const admin = await guard();
    const base = `design-${Math.floor(Math.random() * 9000 + 1000)}`;
    const { data, error } = await admin.from("tomivo_designs")
      .insert({ title: "Untitled design", slug: base, sort_order: Date.now() % 100000 })
      .select("id").single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/tomivo");
    return { ok: true, id: data.id };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function updateDesign(id: string, patch: Partial<{
  title: string; slug: string; description: string; category: string; tags: string;
  prompt_text: string; html_code: string; css_code: string; preview_html: string;
  thumbnail_color: string; is_featured: boolean; is_premium: boolean; is_published: boolean; sort_order: number;
}>): Promise<R> {
  try {
    const admin = await guard();
    const clean: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
    if (patch.slug !== undefined) clean.slug = slugify(patch.slug);
    const { error } = await admin.from("tomivo_designs").update(clean).eq("id", id);
    if (error) return { ok: false, error: error.code === "23505" ? "That slug is already taken." : error.message };
    revalidatePath("/admin/tomivo"); revalidatePath("/tomora-ai/designs");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function deleteDesign(id: string): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("tomivo_designs").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/tomivo"); revalidatePath("/tomora-ai/designs");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}
