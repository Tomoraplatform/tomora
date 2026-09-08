import { createClient } from "@/lib/supabase/server";
import { HelpAndSupport } from "@/components/dashboard/help-support";

export const metadata = { title: "Help & Support | Tomora" };

export default async function HelpPage() {
  // Prefill the reply address with the one on the account, while still letting
  // them send from another, which is what people do when the account address
  // is the thing they cannot get into.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <HelpAndSupport defaultEmail={user?.email ?? ""} />;
}
