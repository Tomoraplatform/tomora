import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Route names and system words that can never be claimed as a handle.
 * Also covers subdomains already pointed at other Vercel projects, since
 * those resolve outside this app and a customer claiming the name would
 * get a site they can never reach.
 */
const BLOCKED = new Set([
  "www", "api", "admin", "app", "dashboard", "academy", "login", "signup", "onboarding",
  "tomora", "tomora-ai", "designs", "c", "s", "sites", "preview", "editor", "terms",
  "privacy", "help", "support", "billing", "wallet", "static", "assets", "public", "blog",
  "pocketlyst",
]);

export function slugifyHandle(raw: string): string {
  return (raw || "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * Checks a creator handle against blocked words, existing creators AND
 * existing site subdomains — one shared namespace, so a handle can never
 * shadow a customer site (and the reverse stays true too).
 */
export async function handleAvailable(handle: string): Promise<{ ok: boolean; error?: string }> {
  const h = slugifyHandle(handle);
  if (h.length < 3) return { ok: false, error: "Use at least 3 characters (letters, numbers and dashes)." };
  if (BLOCKED.has(h)) return { ok: false, error: "That name is reserved. Please choose another." };

  const admin = createAdminClient();
  const [{ data: creator }, { data: site }, { data: reserved }] = await Promise.all([
    admin.from("academy_creators").select("id").eq("slug", h).maybeSingle(),
    admin.from("sites").select("id").eq("subdomain", h).maybeSingle(),
    admin.from("reserved_handles").select("handle").eq("handle", h).maybeSingle(),
  ]);
  if (creator || site || reserved) return { ok: false, error: "That name is taken. Please choose another." };
  return { ok: true };
}

/** Records a handle in the shared registry (best effort, non-fatal). */
export async function reserveHandle(handle: string, kind: "site" | "creator"): Promise<void> {
  const admin = createAdminClient();
  await admin.from("reserved_handles").insert({ handle: slugifyHandle(handle), kind });
}
