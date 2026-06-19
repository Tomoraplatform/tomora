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

  // If they already have a site, send them to the dashboard.
  const { data: sites } = await supabase
    .from("sites")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);
  if (sites && sites.length > 0) redirect("/dashboard");

  return <OnboardingWizard defaultEmail={user.email ?? undefined} />;
}
