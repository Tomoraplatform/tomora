import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreatorsManager, type AdminCreatorRow, type AdminPayoutRow, type AdminDomainReq } from "@/components/admin/creators-manager";

export const metadata = { robots: { index: false, follow: false }, title: "Creators | Admin | Tomora" };
export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: creators }, { data: courses }, { data: lessons }, { data: payouts }, { data: students }, { data: domainReqs }] = await Promise.all([
    admin.from("academy_creators").select("*").order("created_at", { ascending: false }),
    admin.from("creator_courses").select("*").order("created_at", { ascending: false }),
    admin.from("creator_lessons").select("course_id"),
    admin.from("creator_payouts").select("*").order("created_at", { ascending: false }),
    admin.from("academy_students").select("id, name, email"),
    admin.from("creator_domain_requests").select("*").order("created_at", { ascending: false }),
  ]);

  const lessonCounts: Record<string, number> = {};
  (lessons as { course_id: string }[] | null)?.forEach((l) => { lessonCounts[l.course_id] = (lessonCounts[l.course_id] || 0) + 1; });

  const creatorById = new Map(((creators as any[]) || []).map((c) => [c.id, c]));
  const studentById = new Map(((students as any[]) || []).map((s) => [s.id, s]));

  const rows: AdminCreatorRow[] = ((courses as any[]) || []).map((c) => {
    const creator = creatorById.get(c.creator_id);
    const student = creator ? studentById.get(creator.student_id) : null;
    return {
      courseId: c.id,
      title: c.title,
      slug: c.slug,
      creatorSlug: creator?.slug || "",
      authorName: creator?.author_name || "Unknown",
      email: student?.email || "—",
      price: c.price,
      purchases: c.purchases || 0,
      lessons: lessonCounts[c.id] || 0,
      isPublished: !!c.is_published,
      isActive: !!c.is_active,
      featured: !!c.featured_at,
      bannerUrl: c.banner_url,
      createdAt: c.created_at,
    };
  });

  const payoutRows: AdminPayoutRow[] = ((payouts as any[]) || []).map((p) => {
    const creator = creatorById.get(p.creator_id);
    return {
      id: p.id,
      authorName: creator?.author_name || "Unknown",
      bank: creator ? `${creator.bank_name || "—"} · ${creator.account_number || "—"} · ${creator.account_name || "—"}` : "—",
      amount: p.amount,
      status: p.status,
      createdAt: p.created_at,
    };
  });

  const domainRows: AdminDomainReq[] = ((domainReqs as any[]) || []).map((r) => {
    const creator = creatorById.get(r.creator_id);
    return {
      id: r.id, domain: r.domain, status: r.status, amount: r.amount,
      authorName: creator?.author_name || "Unknown",
      createdAt: r.created_at,
    };
  });

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="text-2xl font-bold text-ink">Creators</h1>
        <p className="mt-1 text-ink/60">
          Courses uploaded by academy users. Approve a course to also show it on the main Tomora Academy catalog. {rows.length} course{rows.length === 1 ? "" : "s"} from {creators?.length || 0} creator{(creators?.length || 0) === 1 ? "" : "s"}.
        </p>
        <div className="mt-6">
          <CreatorsManager rows={rows} payouts={payoutRows} domains={domainRows} />
        </div>
      </div>
    </div>
  );
}
