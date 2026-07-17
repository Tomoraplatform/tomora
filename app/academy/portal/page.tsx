import { redirect } from "next/navigation";
import { BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";
import { currentStudent } from "@/lib/academy/auth";
import { listPublishedCourses } from "@/lib/academy/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { AcademyHeader } from "@/components/academy/academy-header";
import { PurchaseButton } from "@/components/academy/purchase-button";
import { SupportCard } from "@/components/academy/support-card";

export const metadata = { title: "My Portal | Tomora Academy" };
export const dynamic = "force-dynamic";

export default async function AcademyPortalPage({ searchParams }: { searchParams: { status?: string } }) {
  const student = await currentStudent();
  if (!student) redirect("/academy/join");

  const admin = createAdminClient();
  const [courses, { data: enrollments }, { data: progress }, { data: lessons }] = await Promise.all([
    listPublishedCourses(),
    admin.from("academy_enrollments").select("course_id").eq("student_id", student.id),
    admin.from("academy_progress").select("lesson_id").eq("student_id", student.id),
    admin.from("academy_lessons").select("id, course_id"),
  ]);

  const enrolledIds = new Set((enrollments as { course_id: string }[] | null)?.map((r) => r.course_id));
  const doneLessons = new Set((progress as { lesson_id: string }[] | null)?.map((r) => r.lesson_id));
  const lessonsByCourse: Record<string, string[]> = {};
  (lessons as { id: string; course_id: string }[] | null)?.forEach((l) => {
    (lessonsByCourse[l.course_id] ||= []).push(l.id);
  });
  const pct = (courseId: string) => {
    const ids = lessonsByCourse[courseId] || [];
    if (!ids.length) return 0;
    return Math.round((ids.filter((id) => doneLessons.has(id)).length / ids.length) * 100);
  };

  const mine = courses.filter((c) => enrolledIds.has(c.id));
  const others = courses.filter((c) => !enrolledIds.has(c.id));

  return (
    <div className="min-h-screen bg-cream">
      <AcademyHeader student={student} />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-bold text-ink">Welcome back, {student.name.split(" ")[0]}</h1>
        <p className="mt-1 text-ink/60">Pick up where you left off.</p>

        {searchParams.status === "pending" && (
          <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            We&apos;re confirming your payment, your course will unlock here within a few minutes.
          </div>
        )}

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink/50">My courses</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">You haven&apos;t enrolled in a course yet, browse the courses below.</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c) => {
              const p = pct(c.id);
              return (
                <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
                  <div className="aspect-video bg-ink/5">
                    {c.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" />
                    ) : <div className="flex h-full items-center justify-center"><GraduationCap className="h-10 w-10 text-ink/20" /></div>}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-bold text-ink">{c.title}</h3>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-ink/50">
                        <span>{p === 100 ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span> : `${p}% complete`}</span>
                        <span>{c.lessonCount} lessons</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${p}%` }} />
                      </div>
                    </div>
                    <div className="mt-auto pt-4">
                      <PurchaseButton courseId={c.id} slug={c.slug} price={c.price} signedIn enrolled />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {others.length > 0 && (
          <>
            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-ink/50">Available courses</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((c) => (
                <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
                  <div className="aspect-video bg-ink/5">
                    {c.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" />
                    ) : <div className="flex h-full items-center justify-center"><GraduationCap className="h-10 w-10 text-ink/20" /></div>}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-bold text-ink">{c.title}</h3>
                    {c.short_description && <p className="mt-1.5 line-clamp-2 text-sm text-ink/60">{c.short_description}</p>}
                    <p className="mt-2 inline-flex items-center gap-1 text-sm text-ink/50"><BookOpen className="h-4 w-4" /> {c.lessonCount} lessons</p>
                    <div className="mt-auto pt-4">
                      <PurchaseButton courseId={c.id} slug={c.slug} price={c.price} signedIn />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-12">
          <SupportCard studentName={student.name} studentEmail={student.email} />
        </div>
      </div>
    </div>
  );
}
