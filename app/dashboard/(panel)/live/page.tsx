import { MessageCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
import { liveConfigured, liveNumber, storeLink, LIVE_COMMISSION_PERCENT } from "@/lib/live/config";
import { LiveManager } from "@/components/dashboard/live-manager";

export const metadata = { title: "Tomora Live | Tomora" };

export default async function LivePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const siteId = user ? await currentSiteId(user.id) : null;
  const admin = createAdminClient();

  const { data: account } = siteId
    ? await admin.from("live_accounts").select("*").eq("site_id", siteId).maybeSingle()
    : { data: null };

  // How Live is actually doing, counted from the orders it produced.
  let orders = 0;
  let revenue = 0;
  if (siteId) {
    const { data: rows } = await admin
      .from("orders")
      .select("amount, paystack_reference")
      .eq("site_id", siteId)
      .eq("channel", "whatsapp")
      // Live's own figures are real money only; the sandbox never sells here.
      .eq("is_test", false)
      .in("status", ["paid", "packed", "shipped", "delivered"]);
    const references = new Set<string>();
    for (const r of ((rows as any[]) || [])) {
      revenue += r.amount || 0;
      if (r.paystack_reference) references.add(r.paystack_reference);
    }
    orders = references.size;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <MessageCircle className="h-6 w-6 text-emerald-600" /> Tomora Live
        </h1>
        <p className="mt-1 text-ink/60">
          Your shop, inside WhatsApp. Customers browse, order and pay without leaving the chat, and
          without you typing a word.
        </p>
      </div>

      <LiveManager
        hasSite={!!siteId}
        active={!!account && account.status === "active"}
        activated={!!account}
        storeCode={account?.store_code || null}
        greeting={account?.greeting || ""}
        link={account?.store_code ? storeLink(account.store_code) : null}
        connected={liveConfigured()}
        number={liveNumber()}
        commission={LIVE_COMMISSION_PERCENT}
        stats={{ orders, revenue }}
      />
    </div>
  );
}
