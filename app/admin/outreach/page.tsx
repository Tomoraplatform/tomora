import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteLiveUrl } from "@/lib/site-url";
import { stageOf } from "@/lib/outreach";
import { OutreachComposer, type OutreachRow } from "@/components/admin/outreach-composer";

export const metadata = { robots: { index: false, follow: false }, title: "Outreach | Admin | Tomora" };
export const dynamic = "force-dynamic";

/**
 * Email the people who signed up and then stopped.
 *
 * The list is built from what each account actually has: a site or not,
 * published or not, products, sales. That is what decides which message is
 * worth sending, so it is what the page sorts and filters on.
 */
export default async function OutreachPage() {
  await requireAdmin();
  const admin = createAdminClient();

  // marketing_opt_out and unsubscribe_token arrive in 0048; fall back so this
  // page still loads, and says why, on a database that has not run it.
  let profiles: any[] | null = null;
  let needsMigration = false;
  {
    const res = await admin.from("profiles").select("user_id, email, business_name, created_at, is_admin, marketing_opt_out");
    if (res.error) {
      needsMigration = true;
      const plain = await admin.from("profiles").select("user_id, email, business_name, created_at, is_admin");
      profiles = plain.data as any[];
    } else profiles = res.data as any[];
  }

  const [{ data: sites }, { data: subs }, { data: products }, { data: paidOrders }] = await Promise.all([
    admin.from("sites").select("id, user_id, subdomain, custom_domain, domain_status, is_live, category, is_demo, created_at"),
    admin.from("subscriptions").select("user_id, status, plan"),
    admin.from("products").select("site_id"),
    admin.from("orders").select("site_id").eq("status", "paid"),
  ]);

  const contacted = new Map<string, string>();
  if (!needsMigration) {
    const { data } = await admin
      .from("outreach_messages").select("user_id, created_at").order("created_at", { ascending: false });
    for (const m of (data as any[]) || []) if (m.user_id && !contacted.has(m.user_id)) contacted.set(m.user_id, m.created_at);
  }

  const siteByUser = new Map<string, any>();
  for (const s of ((sites as any[]) || []).filter((s) => !s.is_demo)) {
    if (!siteByUser.has(s.user_id)) siteByUser.set(s.user_id, s);
  }
  const subByUser = new Map(((subs as any[]) || []).map((s) => [s.user_id, s]));
  const productCount = new Map<string, number>();
  for (const p of (products as any[]) || []) productCount.set(p.site_id, (productCount.get(p.site_id) || 0) + 1);
  const orderCount = new Map<string, number>();
  for (const o of (paidOrders as any[]) || []) orderCount.set(o.site_id, (orderCount.get(o.site_id) || 0) + 1);

  const rows: OutreachRow[] = (profiles || [])
    .filter((p) => !p.is_admin)
    .map((p) => {
      const site = siteByUser.get(p.user_id);
      const sub = subByUser.get(p.user_id);
      const facts = {
        createdAt: p.created_at,
        hasSite: !!site,
        isLive: !!site?.is_live,
        isStore: site?.category === "ecommerce",
        productCount: site ? productCount.get(site.id) || 0 : 0,
        paidOrderCount: site ? orderCount.get(site.id) || 0 : 0,
        subscriptionActive: sub?.status === "active",
        lastContactedAt: contacted.get(p.user_id) || null,
        optedOut: !!p.marketing_opt_out,
        email: p.email || null,
      };
      return {
        userId: p.user_id,
        email: p.email || "",
        name: p.business_name || "",
        createdAt: p.created_at,
        stage: stageOf(facts),
        plan: sub?.status === "active" ? sub?.plan || "paid" : "free",
        host: site ? siteLiveUrl(site).replace(/^https?:\/\//, "") : "",
        lastContactedAt: facts.lastContactedAt,
        optedOut: facts.optedOut,
      };
    });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Send className="h-6 w-6" /> Outreach
        </h1>
        <p className="mt-1 text-ink/60">
          Email the people who signed up and stopped. Sent from {""}
          <span className="font-medium text-ink">your Tomora support address</span>, so their reply comes back to you.
        </p>
      </div>

      {needsMigration && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Run <code>supabase/migrations/0048_outreach.sql</code> first.</p>
          <p className="mt-1">
            Until then there is nowhere to record who was emailed, and nobody can unsubscribe.
            The list below still works, but sending is switched off.
          </p>
        </div>
      )}

      <OutreachComposer rows={rows} disabled={needsMigration} />
    </div>
  );
}
