import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";

/** Returns the admin's email if the current session is an admin, else null. */
export async function requireAdmin(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const ok = await isAdminEmail(user.email);
  return ok ? user.email : null;
}
