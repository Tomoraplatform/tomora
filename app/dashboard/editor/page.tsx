import { getDashboardData } from "@/lib/dashboard";
import { EditorClient } from "@/components/editor/editor-client";
import { APP_DOMAIN } from "@/lib/constants";

export const metadata = { title: "Site Editor — Tomora" };

export default async function EditorPage() {
  const { site } = await getDashboardData();
  // getDashboardData redirects to /onboarding when there is no site.
  const liveUrl =
    site!.custom_domain && site!.domain_status === "active"
      ? `https://${site!.custom_domain}`
      : `https://${site!.subdomain}.${APP_DOMAIN}`;

  return <EditorClient site={site!} liveUrl={liveUrl} />;
}
