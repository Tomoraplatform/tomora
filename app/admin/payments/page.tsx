import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, HeartPulse } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSubaccount, type SubaccountCheck } from "@/lib/paystack";
import { loadPlanFeeRates, policyFrom, type SubscriptionFeeFields } from "@/lib/plan-fees";
import { feeRateLabel } from "@/lib/platform-fee";
import { getPlan, APP_DOMAIN } from "@/lib/constants";
import { diagnose, worst, type HealthIssue } from "@/lib/payments-health";
import { ReconnectPayoutsButton } from "@/components/admin/reconnect-payouts-button";

export const metadata = { robots: { index: false, follow: false }, title: "Payments health | Admin | Tomora" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SiteRow = {
  id: string; user_id: string; subdomain: string; custom_domain: string | null; domain_status: string | null;
  category: string; is_live: boolean; is_demo?: boolean | null; site_data: any;
  bank_code: string | null; bank_name: string | null; account_number: string | null; paystack_subaccount: string | null;
};

/** Runs `fn` over `items`, a few at a time, so Paystack is not hit all at once. */
async function inBatches<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

/**
 * Every store and donation site, checked against Paystack: can it actually
 * take money right now, and if not, why. Read-only, apart from the
 * Reconnect button, which only acts when clicked.
 */
export default async function PaymentsHealthPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: siteRows }, { data: subs }, { data: profiles }, feeConfig] = await Promise.all([
    admin.from("sites").select("*"),
    admin.from("subscriptions").select("*"),
    admin.from("profiles").select("user_id, email, business_name"),
    loadPlanFeeRates(),
  ]);

  const sites = ((siteRows as SiteRow[]) || []).filter((s) =>
    !s.is_demo && (s.category === "ecommerce" || s.category === "organization" || !!s.site_data?.donationEnabled));
  const subByUser = new Map(((subs as (SubscriptionFeeFields & { user_id: string })[]) || []).map((s) => [s.user_id, s]));
  const profileByUser = new Map(((profiles as { user_id: string; email: string | null; business_name: string | null }[]) || []).map((p) => [p.user_id, p]));

  // One lookup per distinct payout account.
  const codes = Array.from(new Set(sites.map((s) => s.paystack_subaccount).filter(Boolean) as string[]));
  const checks = new Map<string, SubaccountCheck | { error: string }>();
  await inBatches(codes, 6, async (code) => {
    try { checks.set(code, await fetchSubaccount(code)); }
    catch (e: any) { checks.set(code, { error: e?.message || "no answer" }); }
  });

  const rows = sites.map((s) => {
    const policy = policyFrom(subByUser.get(s.user_id) || null, feeConfig);
    const kind: "store" | "donations" = s.category === "ecommerce" ? "store" : "donations";
    const issues: HealthIssue[] = diagnose({
      kind,
      isLive: !!s.is_live,
      subaccount: s.paystack_subaccount,
      bankCode: s.bank_code,
      accountNumber: s.account_number,
      paystackOn: s.site_data?.paymentMethods?.paystack,
      transferOn: s.site_data?.paymentMethods?.transfer,
      allowBankTransfer: policy.allowBankTransfer,
      paystack: s.paystack_subaccount ? checks.get(s.paystack_subaccount) : undefined,
    });
    const host = s.custom_domain && s.domain_status === "active" ? s.custom_domain : `${s.subdomain}.${APP_DOMAIN}`;
    return {
      site: s, kind, issues, status: worst(issues), host,
      name: s.site_data?.businessName || s.subdomain,
      owner: profileByUser.get(s.user_id)?.email || "—",
      plan: getPlan(policy.planId)?.name || policy.planId,
      fee: feeRateLabel(policy.rate),
    };
  });

  const order = { broken: 0, warning: 1, ok: 2 } as const;
  rows.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  const count = (st: "broken" | "warning" | "ok") => rows.filter((r) => r.status === st).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <HeartPulse className="h-6 w-6" /> Payments health
        </h1>
        <p className="mt-1 text-ink/60">
          Every store and donation site, checked live against Paystack with the key this server uses.
          Sandbox demo stores are left out.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary tone="broken" n={count("broken")} label="cannot take payments" />
        <Summary tone="warning" n={count("warning")} label="need a look" />
        <Summary tone="ok" n={count("ok")} label="healthy" />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-ink/50">No store or donation sites yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.site.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <StatusIcon status={r.status} /> {r.name}
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/60">{r.kind}</span>
                  </p>
                  <p className="mt-1 text-sm text-ink/60">
                    <a href={`https://${r.host}`} target="_blank" rel="noreferrer" className="underline">{r.host}</a>
                    {" · "}{r.owner}{" · "}{r.plan}{" · "}{r.fee === "No" ? "no fee" : `${r.fee} fee`}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/45">
                    Payout: {r.site.account_number ? `${r.site.bank_name || "bank"} ${r.site.account_number}` : "none"}
                    {r.site.paystack_subaccount ? ` · ${r.site.paystack_subaccount}` : ""}
                  </p>
                </div>
                {r.issues.some((i) => i.repairable) && <ReconnectPayoutsButton siteId={r.site.id} siteName={r.name} />}
              </div>
              {r.issues.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {r.issues.map((i, n) => (
                    <li key={n} className={i.severity === "broken" ? "text-red-700" : "text-amber-800"}>
                      {i.severity === "broken" ? "✕" : "!"} {i.message}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: "broken" | "warning" | "ok" }) {
  if (status === "broken") return <XCircle className="h-4 w-4 shrink-0 text-red-600" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />;
  return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />;
}

function Summary({ tone, n, label }: { tone: "broken" | "warning" | "ok"; n: number; label: string }) {
  const cls = tone === "broken" ? "border-red-200 bg-red-50 text-red-800"
    : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <p className="text-2xl font-bold">{n}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}
