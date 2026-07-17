import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { novaEnabled } from "@/lib/nova-flag";
import { NovaChat } from "@/components/nova/nova-chat";

export const metadata = { robots: { index: false, follow: false },  title: "Nova | AI Website Setup | Tomora" };

export default async function NovaPage() {
  if (!(await novaEnabled())) redirect("/onboarding");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding/nova");

  // Users with a live site manage it from the dashboard instead. Nova would
  // otherwise overwrite their first site's content.
  const { data: sites } = await supabase
    .from("sites").select("is_live").eq("user_id", user.id);
  if (sites?.some((s) => s.is_live)) redirect("/dashboard");

  return <NovaChat />;
}
