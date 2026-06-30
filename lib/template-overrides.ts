import { createClient } from "@/lib/supabase/server";

export type TemplateOverride = { displayName?: string; archived?: boolean; removed?: boolean };
export type TemplateOverrides = Record<string, TemplateOverride>;

/**
 * Admin overrides for catalog templates (rename / archive / remove), keyed by
 * template id. Reads the public-readable `template_settings` table. Returns an
 * empty map on any error so the UI always falls back to the built-in catalog.
 */
export async function getTemplateOverrides(): Promise<TemplateOverrides> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("template_settings").select("*");
    const map: TemplateOverrides = {};
    (data as { template_id: string; display_name: string | null; archived: boolean; removed: boolean }[] | null)?.forEach((r) => {
      map[r.template_id] = { displayName: r.display_name || undefined, archived: !!r.archived, removed: !!r.removed };
    });
    return map;
  } catch {
    return {};
  }
}
