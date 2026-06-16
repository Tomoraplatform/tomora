import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Site, Subscription } from "@/lib/database.types";

export interface DashboardData {
  userId: string;
  email: string | null;
  profile: Profile | null;
  site: Site | null;
  subscription: Subscription | null;
}

/**
 * Loads the signed-in user's profile, site and subscription for dashboard
 * pages. Redirects to /login if unauthenticated and to /onboarding if the
 * user has not created a site yet.
 */
export async function getDashboardData(opts?: { requireSite?: boolean }): Promise<DashboardData> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: site }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("sites").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  if ((opts?.requireSite ?? true) && !site) redirect("/onboarding");

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile) ?? null,
    site: (site as Site) ?? null,
    subscription: (subscription as Subscription) ?? null,
  };
}
