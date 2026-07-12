import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Whether Nova (the AI setup assistant) is switched on. Controlled by admins
 * from the admin dashboard. Fails closed: any error (including migration 0027
 * not yet applied) reads as disabled, so Nova stays hidden by default.
 */
export async function novaEnabled(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("app_settings")
      .select("nova_enabled")
      .eq("id", 1)
      .maybeSingle();
    if (error) return false;
    return !!(data as { nova_enabled?: boolean } | null)?.nova_enabled;
  } catch {
    return false;
  }
}
