import { GraduationCap, BookOpen } from "lucide-react";
import { listPublishedCourses } from "@/lib/academy/db";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AcademyHeader } from "@/components/academy/academy-header";
import { PurchaseButton } from "@/components/academy/purchase-button";

export const metadata = {
  title: "Tomora Academy | Learn practical skills",
  description: "Practical, structured courses you can watch lesson by lesson, right in your browser.",
};
export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const [courses, student] = await Promise.all([listPublishedCourses(), currentStudent()]);

  let enrolledIds = new Set<string>();
  if (student) {
    const admin = createAdminClient();
    const { data } = await admin.from("academy_enrollments").select("course_id").eq("student_id", student.id);
    enrolledIds = new Set((data as { course_id: string }[] | null)?.map((r) => r.course_id));
  }

  return (
    <div className="min-h-screen bg-cream">
      <AcademyHeader student={student} />

      <section className="mx-auto max-w-6xl px-5 pb-4 pt-12 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-cream">
          <GraduationCap className="h-3.5 w-3.5" /> Tomora Academy
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-5xl">Learn skills that pay</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink/60">
          Practical courses you can watch module by module, lesson by lesson, right in your browser. Buy once, learn at your pace.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white/60 p-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-ink/30" />
            <p className="mt-3 font-semibold text-ink">Courses are coming soon</p>
            <p className="mt-1 text-sm text-ink/50">We&apos;re preparing the first course, check back shortly.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
                <div className="aspect-video bg-ink/5">
                  {c.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><GraduationCap className="h-10 w-10 text-ink/20" /></div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-bold text-ink">{c.title}</h2>
                  {c.short_description && <p className="mt-1.5 line-clamp-3 text-sm text-ink/60">{c.short_description}</p>}
                  <div className="mt-3 flex items-center gap-3 text-sm text-ink/50">
                    <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" /> {c.lessonCount} lesson{c.lessonCount === 1 ? "" : "s"}</span>
                  </div>
                  <div className="mt-auto pt-4">
                    <PurchaseButton
                      courseId={c.id} slug={c.slug} price={c.price}
                      signedIn={!!student} enrolled={enrolledIds.has(c.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-ink/10 py-8 text-center text-sm text-ink/40">
        © {new Date().getFullYear()} Tomora Academy · Courses are streamed for enrolled students and not downloadable.
      </footer>
    </div>
  );
}
