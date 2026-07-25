import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Store, ExternalLink, Wallet, Users, TrendingUp } from "lucide-react";
import { currentStudent } from "@/lib/academy/auth";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";
import { getCreatorByStudent, listCreatorCourses, getCreatorCourse } from "@/lib/creator/db";
import { AcademyHeader } from "@/components/academy/academy-header";
import { AuthorProfileForm } from "@/components/creator/author-profile-form";
import { BrandForm } from "@/components/creator/brand-form";
import { CoursesManager } from "@/components/creator/courses-manager";
import { PayoutForm } from "@/components/creator/payout-form";
import { WalletPanel } from "@/components/creator/wallet-panel";
import { DomainPanel } from "@/components/creator/domain-panel";
import { creatorBalance } from "@/lib/creator/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNaira } from "@/lib/utils";
import { APP_DOMAIN } from "@/lib/constants";

export const metadata = { robots: { index: false, follow: false }, title: "Sell your course | Tomora Academy" };
export const dynamic = "force-dynamic";

export default async function SellPage() {
  if (!(await academyOpen())) return <AcademyClosed />;
  const student = await currentStudent();
  if (!student) redirect("/academy/join?next=/academy/sell");

  const creator = await getCreatorByStudent(student.id);

  // Step 1: no profile yet, collect author details first.
  if (!creator) {
    return (
      <div className="min-h-screen bg-cream">
        <AcademyHeader student={student} />
        <div className="mx-auto max-w-2xl px-5 py-10">
          <Link href="/academy/portal" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to portal
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-cream">
            <Store className="h-3.5 w-3.5" /> Sell your course
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">Start by telling students who you are</h1>
          <p className="mt-2 text-ink/60">
            You&apos;ll get your own course page on Tomora, keep 95% of every sale, and your students learn in the same portal they already know.
          </p>
          <div className="mt-6">
            <AuthorProfileForm />
          </div>
        </div>
      </div>
    );
  }

  const summaries = await listCreatorCourses(creator.id);
  const detailed = (await Promise.all(summaries.map((c) => getCreatorCourse(c.id)))).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getCreatorCourse>>>[];

  const totalSales = summaries.reduce((s, c) => s + (c.purchases || 0), 0);
  const liveCount = summaries.filter((c) => c.is_published).length;

  const wallet = await creatorBalance(creator.id);
  const { data: domainReqs } = await createAdminClient()
    .from("creator_domain_requests")
    .select("id, domain, status, created_at")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });
  const { data: walletTx } = await createAdminClient()
    .from("creator_wallet_transactions")
    .select("id, type, source, amount, status, description, created_at")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-cream">
      <AcademyHeader student={student} />
      <div className="mx-auto max-w-5xl px-5 py-10">
        <Link href="/academy/portal" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to portal
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">My course portal</h1>
            <p className="mt-1 text-ink/60">
              Your page: <a href={`https://${APP_DOMAIN}/c/${creator.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ink underline">
                {APP_DOMAIN}/c/{creator.slug} <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>

        {/* stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat icon={Store} label="Courses" value={`${summaries.length}`} sub={`${liveCount} live`} />
          <Stat icon={Users} label="Total sales" value={`${totalSales}`} sub="across all courses" />
          <Stat icon={Wallet} label="Wallet" value={formatNaira(wallet.balance)} sub="available to withdraw" />
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/60">Earnings</h2>
          <WalletPanel
            balance={wallet.balance}
            earned={wallet.earned}
            withdrawn={wallet.withdrawn}
            hasBank={!!creator.account_number}
            transactions={(walletTx as any[]) || []}
          />
          <p className="mt-2 text-xs text-ink/50">You keep 95% of every sale. Tomora&apos;s fee is 5%. Students pay VAT and the card processing fee on top of your price, so your share is never reduced.</p>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/60">Your courses</h2>
          <CoursesManager courses={detailed} creatorSlug={creator.slug} />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/60">Author profile</h2>
          <AuthorProfileForm initial={{
            handle: creator.slug,
            authorName: creator.author_name,
            authorBio: creator.author_bio,
            authorPhotoUrl: creator.author_photo_url || "",
            showAuthor: creator.show_author,
          }} />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/60">Brand and colours</h2>
          <BrandForm initial={{
            brandName: creator.brand_name || "",
            logoUrl: creator.logo_url || "",
            brandColor: creator.brand_color || "#242B3D",
            brandColor2: creator.brand_color_2 || "#F3E969",
          }} />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/60">Your domain</h2>
          <DomainPanel
            creatorSlug={creator.slug}
            customDomain={creator.custom_domain ?? null}
            requests={((domainReqs as any[]) || []).map((r) => ({ id: r.id, domain: r.domain, status: r.status, createdAt: r.created_at }))}
            appDomain={APP_DOMAIN}
          />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/60">Payout account</h2>
          <PayoutForm initial={{
            bankName: creator.bank_name || "",
            bankCode: creator.bank_code || "",
            accountNumber: creator.account_number || "",
            accountName: creator.account_name || "",
          }} />
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-ink/50" />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink/50">{sub}</p>}
    </div>
  );
}
