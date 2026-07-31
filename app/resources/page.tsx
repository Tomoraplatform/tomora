import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listPublishedResources, purchasedIds } from "@/lib/resources/db";
import { ACCESS_COOKIE, readAccessToken } from "@/lib/resources/access";
import { ResourceLibrary } from "@/components/resources/resource-library";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free and premium web resources",
  description:
    "Copy the prompt, copy the HTML or download it. Animated sections, backgrounds, landing pages and full websites, built by Tomora.",
  openGraph: {
    title: "Tomora Resources",
    description:
      "Animated sections, backgrounds, landing pages and full websites. Copy the prompt, copy the HTML or download it.",
  },
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: { unlock?: string };
}) {
  const resources = await listPublishedResources();
  const email = readAccessToken(cookies().get(ACCESS_COOKIE)?.value);
  const owned = email ? await purchasedIds(email) : [];

  return (
    <ResourceLibrary
      resources={resources}
      owned={owned}
      email={email}
      unlockNotice={searchParams.unlock || null}
    />
  );
}
