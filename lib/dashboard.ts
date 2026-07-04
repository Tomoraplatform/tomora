import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { expireCompIfDue } from "@/lib/billing";
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
  /** True when this login is a staff member working on someone else's account. */
  isStaff: boolean;
  /** Dashboard areas granted to the staff member (empty for owners). */
  staffAreas: string[];
}

/**
 * Loads the signed-in user's profile, sites and subscription. The "current"
 * site is chosen from the `tomora_site` cookie, falling back to the first
 * (primary) site. Redirects to /login if unauthenticated and to /onboarding
 * if the user has no site yet.
 */
export const getDashboardData = cache(async (opts?: { requireSite?: boolean }): Promise<DashboardData> => {
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

  const sub = (subscription as Subscription) ?? null;
  // Expire a comped plan whose period has ended.
  if (sub && (await expireCompIfDue(user.id, sub))) {
    sub.status = "cancelled";
  }

  let sites = (sitesData as Site[]) ?? [];
  let isStaff = false;
  let staffAreas: string[] = [];

  // Staff resolution: a user with no sites of their own who was invited as
  // staff works on the owner's sites, limited to their granted areas (the
  // staff RLS policies enforce this at the data layer too).
  if (sites.length === 0) {
    const { data: membership } = await supabase
      .from("staff_members")
      .select("owner_id, areas")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (membership?.owner_id) {
      const { data: ownerSites } = await supabase
        .from("sites")
        .select("*")
        .eq("user_id", membership.owner_id)
        .order("created_at", { ascending: true });
      sites = (ownerSites as Site[]) ?? [];
      isStaff = sites.length > 0;
      staffAreas = isStaff ? ((membership.areas as string[]) || []) : [];
    }
  }

  if ((opts?.requireSite ?? true) && sites.length === 0) redirect("/onboarding");

  const currentId = cookies().get(SITE_COOKIE)?.value;
  const site = sites.find((s) => s.id === currentId) ?? sites[0] ?? null;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile) ?? null,
    site,
    sites,
    subscription: sub,
    isStaff,
    staffAreas,
  };
});

/**
 * Resolves the current site id for write actions (server actions / routes),
 * validating ownership. Falls back to the user's first site.
 */
export const currentSiteId = cache(async (userId: string): Promise<string | null> => {
  const supabase = createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  let list = (sites as { id: string }[]) ?? [];

  // Staff fallback: no sites of their own → resolve the owner's sites.
  if (!list.length) {
    const { data: membership } = await supabase
      .from("staff_members")
      .select("owner_id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (membership?.owner_id) {
      const { data: ownerSites } = await supabase
        .from("sites")
        .select("id")
        .eq("user_id", membership.owner_id)
        .order("created_at", { ascending: true });
      list = (ownerSites as { id: string }[]) ?? [];
    }
  }

  if (!list.length) return null;
  const cookieId = cookies().get(SITE_COOKIE)?.value;
  return list.find((s) => s.id === cookieId)?.id ?? list[0].id;
});
