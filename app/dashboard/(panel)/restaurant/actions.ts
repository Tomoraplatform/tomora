"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
import type { SiteData } from "@/lib/database.types";
import { DEFAULT_TIMEZONE, type Combo, type OpeningHour, type RestaurantSettings } from "@/lib/restaurant/types";
import { toMinutes } from "@/lib/restaurant/hours";
import { normaliseWhatsapp } from "@/lib/restaurant/order";

type R = { ok: boolean; error?: string };

const clampMins = (v: unknown, max = 600) =>
  Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

/** "H:M" or rubbish becomes a safe "HH:MM"; the storefront relies on this. */
function cleanTime(v: unknown, fallback: string): string {
  const s = String(v || "").trim();
  return toMinutes(s) === null ? fallback : s.padStart(5, "0");
}

/**
 * Saves the restaurant panel. Everything is sanitised here rather than trusted
 * from the form, because the storefront and the checkout both read these values
 * (combo prices in particular are charged from this row).
 */
export async function saveRestaurant(input: RestaurantSettings): Promise<R> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const siteId = await currentSiteId(user.id);
    if (!siteId) return { ok: false, error: "No site found." };

    const { data: site } = await supabase
      .from("sites").select("id, site_data").eq("id", siteId).maybeSingle();
    if (!site) return { ok: false, error: "No site found." };

    const hours: OpeningHour[] = Array.from({ length: 7 }, (_, day) => {
      const h = (input.hours || []).find((x) => Number(x.day) === day);
      return {
        day,
        open: cleanTime(h?.open, "09:00"),
        close: cleanTime(h?.close, "21:00"),
        closed: !!h?.closed,
      };
    });

    const combos: Combo[] = (input.combos || []).slice(0, 60).map((c, i) => {
      const price = Math.max(0, Math.round(Number(c.price) || 0));
      const compare = Math.max(0, Math.round(Number(c.comparePrice) || 0));
      return {
        id: String(c.id || `combo-${Date.now()}-${i}`).slice(0, 60),
        name: String(c.name || "").trim().slice(0, 90),
        description: String(c.description || "").trim().slice(0, 240),
        price,
        // Only keep a compare price that is actually higher, so no card ever
        // shows a nonsense "saving".
        comparePrice: compare > price ? compare : undefined,
        image: String(c.image || "").trim().slice(0, 600) || undefined,
        items: (c.items || []).map((s) => String(s).trim().slice(0, 80)).filter(Boolean).slice(0, 12),
        available: c.available !== false,
      };
    }).filter((c) => c.name && c.price > 0);

    const clean: RestaurantSettings = {
      whatsappNumber: normaliseWhatsapp(input.whatsappNumber),
      prepTimeMins: clampMins(input.prepTimeMins),
      deliveryTimeMins: clampMins(input.deliveryTimeMins),
      pickupEnabled: !!input.pickupEnabled,
      pickupAddress: String(input.pickupAddress || "").trim().slice(0, 240),
      pickupNote: String(input.pickupNote || "").trim().slice(0, 240),
      deliveryEnabled: !!input.deliveryEnabled,
      minOrder: Math.max(0, Math.round(Number(input.minOrder) || 0)),
      hours,
      timezone: String(input.timezone || DEFAULT_TIMEZONE).slice(0, 60),
      combos,
      closeOutsideHours: !!input.closeOutsideHours,
    };

    // A restaurant that offers neither delivery nor pickup cannot take orders.
    if (!clean.deliveryEnabled && !clean.pickupEnabled) {
      return { ok: false, error: "Turn on delivery, pickup, or both. Otherwise nobody can order." };
    }

    const sd = (site.site_data || {}) as SiteData;
    const { error } = await supabase
      .from("sites")
      .update({ site_data: { ...sd, restaurant: clean } })
      .eq("id", site.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/restaurant");
    revalidatePath("/dashboard/editor");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save." };
  }
}
