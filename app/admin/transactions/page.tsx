import Link from "next/link";
import { ArrowLeft, ShoppingBag, HeartHandshake, CreditCard, Globe, TrendingUp, Layers, GraduationCap, Store, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformBalance } from "@/lib/creator/money";
import { PlatformWallet } from "@/components/admin/platform-wallet";
import { formatNaira } from "@/lib/utils";

export const metadata = { robots: { index: false, follow: false }, title: "Transactions | Admin | Tomora" };
export const dynamic = "force-dynamic";

type Row = {
  kind: string; gross_amount: number; platform_amount: number;
  payee_amount: number; vat_amount: number; created_at: string; description: string | null;
};

const KIND_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  subscription: { label: "Subscriptions", icon: CreditCard },
  domain: { label: "Domains", icon: Globe },
  academy_course: { label: "Academy courses", icon: GraduationCap },
  creator_course: { label: "Creator courses (5% fee)", icon: Store },
  designs: { label: "AI Designs", icon: Sparkles },
  store_order: { label: "Store sales", icon: ShoppingBag },
  donation: { label: "Donations", icon: HeartHandshake },
};

/** Tomora's own revenue kinds (the rest is users' money we only process). */
const TOMORA_KINDS = ["subscription", "domain", "academy_course", "creator_course", "designs"];

function since(days: number) {
  return Date.now() - days * 86400000;
}

export default async function AdminTransactionsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: ledger }, wallet, { data: walletTx }] = await Promise.all([
    admin.from("transactions").select("kind, gross_amount, platform_amount, payee_amount, vat_amount, created_at, description").order("created_at", { ascending: false }).limit(5000),
    platformBalance(),
    admin.from("platform_wallet_transactions").select("id, type, source, amount, status, description, created_at, is_vat").order("created_at", { ascending: false }).limit(12),
  ]);

  const rows = (ledger as Row[]) || [];
  const inPeriod = (r: Row, days?: number) => !days || new Date(r.created_at).getTime() >= since(days);

  // Tomora revenue by period.
  const tomoraRevenue = (days?: number) => rows
    .filter((r) => TOMORA_KINDS.includes(r.kind) && inPeriod(r, days))
    .reduce((s, r) => s + (r.platform_amount || 0), 0);

  // Everything processed on the platform (users' money included).
  const totalVolume = (days?: number) => rows
    .filter((r) => inPeriod(r, days))
    .reduce((s, r) => s + (r.gross_amount || 0), 0);

  const byKind = Object.keys(KIND_META).map((kind) => {
    const list = rows.filter((r) => r.kind === kind);
    return {
      kind,
      count: list.length,
      gross: list.reduce((s, r) => s + (r.gross_amount || 0), 0),
      tomora: list.reduce((s, r) => s + (r.platform_amount || 0), 0),
    };
  }).filter((k) => k.count > 0);

  const vatCollected = rows.reduce((s, r) => s + (r.vat_amount || 0), 0);

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="text-2xl font-bold text-ink">Transactions</h1>
        <p className="mt-1 text-ink/60">Every payment that flows through Tomora, and what belongs to Tomora.</p>

        {/* Tomora wallet */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-ink/70" />
            <h2 className="text-lg font-bold text-ink">Tomora wallet</h2>
          </div>
          <PlatformWallet
            balance={wallet.balance}
            earned={wallet.earned}
            withdrawn={wallet.withdrawn}
            vatHeld={wallet.vatHeld}
            transactions={(walletTx as any[]) || []}
          />
        </section>

        {/* Revenue by period */}
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">Tomora revenue</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Overall" value={formatNaira(tomoraRevenue())} accent />
            <Stat label="This year" value={formatNaira(tomoraRevenue(365))} />
            <Stat label="This month" value={formatNaira(tomoraRevenue(30))} />
            <Stat label="This week" value={formatNaira(tomoraRevenue(7))} />
          </div>
        </section>

        {/* Platform volume by period */}
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-5 w-5 text-ink/70" />
            <h2 className="text-lg font-bold text-ink">Total volume processed</h2>
          </div>
          <p className="mb-4 text-sm text-ink/55">Everything charged through Tomora, including money that settles to users.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Overall" value={formatNaira(totalVolume())} accent />
            <Stat label="This year" value={formatNaira(totalVolume(365))} />
            <Stat label="This month" value={formatNaira(totalVolume(30))} />
            <Stat label="This week" value={formatNaira(totalVolume(7))} />
          </div>
        </section>

        {/* Breakdown by product */}
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">By product</h2>
          {byKind.length === 0 ? (
            <p className="text-sm text-ink/50">No transactions recorded yet. New payments will appear here.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Product</th>
                    <th className="px-4 py-2.5 font-semibold">Count</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Volume</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Tomora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {byKind.map((k) => {
                    const meta = KIND_META[k.kind];
                    const Icon = meta.icon;
                    return (
                      <tr key={k.kind}>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-2 font-medium text-ink">
                            <Icon className="h-4 w-4 text-ink/45" /> {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-ink/60">{k.count}</td>
                        <td className="px-4 py-2.5 text-right text-ink">{formatNaira(k.gross)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-ink">{k.tomora > 0 ? formatNaira(k.tomora) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-ink/50">VAT collected to date: {formatNaira(vatCollected)}. VAT is held separately and excluded from the withdrawable balance.</p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-ink/15 bg-ink text-cream" : "border-ink/10 bg-white text-ink"}`}>
      <span className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-cream/70" : "text-ink/50"}`}>{label}</span>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
