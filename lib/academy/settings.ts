import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Whether Tomora Academy (including creator sales pages and portals) is open.
 * Controlled by admins. Fails OPEN: if the column or row is missing, the
 * academy keeps working rather than showing maintenance to everyone.
 */
export async function academyOpen(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("app_settings")
      .select("academy_open")
      .eq("id", 1)
      .maybeSingle();
    if (error) return true;
    const value = (data as { academy_open?: boolean | null } | null)?.academy_open;
    return value === undefined || value === null ? true : !!value;
  } catch {
    return true;
  }
}
