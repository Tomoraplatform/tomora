import { createAdminClient } from "@/lib/supabase/admin";
import { SETTINGS } from "@/lib/constants";

export interface AppSettings {
  whatsappLink: string;
  feedbackEmail: string;
  coursePrice: number; // major units
  currency: string;
  supportEmail: string;
}

const DEFAULTS: AppSettings = {
  whatsappLink: "#",
  feedbackEmail:
    process.env.FEEDBACK_RECIPIENT_EMAIL || "tommyconcept4@gmail.com",
  coursePrice: Number(process.env.COURSE_PRICE || 9999),
  currency: process.env.COURSE_CURRENCY || "NGN",
  supportEmail: process.env.ADMIN_EMAIL || "support@yourdomain.com",
};

/** Reads settings from app_settings, falling back to env defaults. */
export async function getSettings(): Promise<AppSettings> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("app_settings")
      .select("setting_key, setting_value");

    const map = new Map(
      (data || []).map((r) => [r.setting_key, r.setting_value]),
    );

    return {
      whatsappLink: map.get(SETTINGS.whatsappLink) || DEFAULTS.whatsappLink,
      feedbackEmail: map.get(SETTINGS.feedbackEmail) || DEFAULTS.feedbackEmail,
      coursePrice: Number(map.get(SETTINGS.coursePrice) || DEFAULTS.coursePrice),
      currency: map.get(SETTINGS.currency) || DEFAULTS.currency,
      supportEmail: map.get(SETTINGS.supportEmail) || DEFAULTS.supportEmail,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function updateSetting(key: string, value: string) {
  const supabase = createAdminClient();
  return supabase
    .from("app_settings")
    .upsert({ setting_key: key, setting_value: value }, { onConflict: "setting_key" });
}
