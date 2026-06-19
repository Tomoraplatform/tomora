import { getDashboardData } from "@/lib/dashboard";
import { EditorClient } from "@/components/editor/editor-client";
import { siteLiveUrl } from "@/lib/site-url";

export const metadata = { title: "Site Editor — Tomora" };

export default async function EditorPage() {
  const { site } = await getDashboardData();
  // getDashboardData redirects to /onboarding when there is no site.
  return <EditorClient site={site!} liveUrl={siteLiveUrl(site!)} />;
}
