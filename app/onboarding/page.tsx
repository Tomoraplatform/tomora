import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { novaEnabled } from "@/lib/nova-flag";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { getTemplateOverrides } from "@/lib/template-overrides";
import { TikTokEvent } from "@/components/analytics/tiktok-pixel";
import { TIKTOK_EVENTS } from "@/lib/tiktok/config";

export const metadata = { robots: { index: false, follow: false },  title: "Set Up Your Site | Tomora" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { ttq?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  // If they already published a site, go to the dashboard. If they only have an
  // unfinished draft, resume the guided builder where it left off.
  const { data: sites } = await supabase
    .from("sites")
    .select("id, is_live, template_id, subdomain, site_data, paystack_subaccount")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (sites?.some((s) => s.is_live)) redirect("/dashboard");
  const draft = sites?.[0] ?? null;

  const templateOverrides = await getTemplateOverrides();
  const nova = await novaEnabled();

  return (
    <>
      {/* Only when this load is the one straight after signing up. */}
      {searchParams?.ttq && (
        <TikTokEvent event={TIKTOK_EVENTS.registration} eventId={searchParams.ttq} />
      )}
      {nova && (
        <a
          href="/onboarding/nova"
          className="flex items-center justify-center gap-2 bg-ink px-4 py-2.5 text-center text-sm font-medium text-cream hover:opacity-95"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>New: let <strong>Nova</strong>, our AI assistant, build your website for you, answer a few questions and go live.</span>
        </a>
      )}
      <OnboardingWizard
        defaultEmail={user.email ?? undefined}
        overrides={templateOverrides}
        resume={draft ? { siteId: draft.id, templateId: draft.template_id, subdomain: draft.subdomain, siteData: draft.site_data, payoutConnected: !!draft.paystack_subaccount } : undefined}
      />
    </>
  );
}
