import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata = { title: "Set Up Your Site — Tomora" };

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  // If they already published a site, go to the dashboard. If they only have an
  // unfinished draft, resume the guided builder where it left off.
  const { data: sites } = await supabase
    .from("sites")
    .select("id, is_live, template_id, subdomain, site_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (sites?.some((s) => s.is_live)) redirect("/dashboard");
  const draft = sites?.[0] ?? null;

  return (
    <OnboardingWizard
      defaultEmail={user.email ?? undefined}
      resume={draft ? { siteId: draft.id, templateId: draft.template_id, subdomain: draft.subdomain, siteData: draft.site_data } : undefined}
    />
  );
}
