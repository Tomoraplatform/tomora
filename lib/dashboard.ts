import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Site, Subscription } from "@/lib/database.types";

export const SITE_COOKIE = "tomora_site";

export interface DashboardData {
  userId: string;
  email: string | null;
  profile: Profile | null;
  /** The currently selected site (cookie-selected, defaults to the first). */
  site: Site | null;
  /** All of the user's sites, oldest first. */
  sites: Site[];
  subscription: Subscription | null;
}

/**
 * Loads the signed-in user's profile, sites and subscription. The "current"
 * site is chosen from the `tomora_site` cookie, falling back to the first
 * (primary) site. Redirects to /login if unauthenticated and to /onboarding
 * if the user has no site yet.
 */
export async function getDashboardData(opts?: { requireSite?: boolean }): Promise<DashboardData> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: sitesData }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("sites").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const sites = (sitesData as Site[]) ?? [];
  if ((opts?.requireSite ?? true) && sites.length === 0) redirect("/onboarding");

  const currentId = cookies().get(SITE_COOKIE)?.value;
  const site = sites.find((s) => s.id === currentId) ?? sites[0] ?? null;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile) ?? null,
    site,
    sites,
    subscription: (subscription as Subscription) ?? null,
  };
}

/**
 * Resolves the current site id for write actions (server actions / routes),
 * validating ownership. Falls back to the user's first site.
 */
export async function currentSiteId(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  const list = (sites as { id: string }[]) ?? [];
  if (!list.length) return null;
  const cookieId = cookies().get(SITE_COOKIE)?.value;
  return list.find((s) => s.id === cookieId)?.id ?? list[0].id;
}
