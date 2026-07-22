import { GraduationCap, BookOpen, Star } from "lucide-react";
import { listPublishedCourses, courseRatings, listAllReviews } from "@/lib/academy/db";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AcademyHeader } from "@/components/academy/academy-header";
import { PurchaseButton } from "@/components/academy/purchase-button";
import { NotifyButton } from "@/components/academy/notify-button";

function Stars({ value, className = "h-3.5 w-3.5" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-ink/15"}`} />
      ))}
    </span>
  );
}

export const metadata = {
  title: "Tomora Academy | Learn practical skills",
  description: "Practical, structured courses you can watch lesson by lesson, right in your browser.",
};
export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const [courses, student, ratings, reviews] = await Promise.all([
    listPublishedCourses(), currentStudent(), courseRatings(), listAllReviews(),
  ]);
  const publishedIds = new Set(courses.map((c) => c.id));
  const courseTitle = new Map(courses.map((c) => [c.id, c.title]));
  const shownReviews = reviews.filter((r) => publishedIds.has(r.course_id)).slice(0, 9);

  let enrolledIds = new Set<string>();
  if (student) {
    const admin = createAdminClient();
    const { data } = await admin.from("academy_enrollments").select("course_id").eq("student_id", student.id);
    enrolledIds = new Set((data as { course_id: string }[] | null)?.map((r) => r.course_id));
  }

  return (
    <div className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Tomora Academy courses",
            itemListElement: courses.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Course",
                name: c.title,
                description: c.short_description || undefined,
                url: "https://www.tomora.com.ng/academy",
                image: c.thumbnail_url || undefined,
                provider: { "@type": "Organization", name: "Tomora Academy", url: "https://www.tomora.com.ng/academy" },
                offers: { "@type": "Offer", price: String(c.price), priceCurrency: "NGN", availability: "https://schema.org/InStock" },
                hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT3H" },
              },
            })),
          }),
        }}
      />
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
                <div className="relative aspect-video bg-ink/5">
                  {c.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><GraduationCap className="h-10 w-10 text-ink/20" /></div>
                  )}
                  {c.is_coming_soon && (
                    <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Coming soon</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-bold text-ink">{c.title}</h2>
                  {c.short_description && <p className="mt-1.5 line-clamp-3 text-sm text-ink/60">{c.short_description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink/50">
                    <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" /> {c.is_coming_soon ? (c.coming_soon_lessons || 0) : c.lessonCount} lesson{(c.is_coming_soon ? (c.coming_soon_lessons || 0) : c.lessonCount) === 1 ? "" : "s"}</span>
                    {ratings[c.id] && (
                      <span className="inline-flex items-center gap-1">
                        <Stars value={ratings[c.id].avg} />
                        <span className="text-ink/60">{ratings[c.id].avg.toFixed(1)}</span>
                        <span className="text-ink/40">({ratings[c.id].count})</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-auto pt-4">
                    {c.is_coming_soon ? (
                      <NotifyButton courseId={c.id} defaultEmail={student?.email || ""} />
                    ) : (
                      <PurchaseButton
                        courseId={c.id} slug={c.slug} price={c.price}
                        signedIn={!!student} enrolled={enrolledIds.has(c.id)}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {shownReviews.length > 0 && (
        <section className="border-t border-ink/10 bg-white/50">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="text-center text-2xl font-bold text-ink">What students say</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shownReviews.map((r) => (
                <figure key={r.id} className="flex flex-col rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                  <Stars value={r.rating} className="h-4 w-4" />
                  {r.body && <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/70">“{r.body}”</blockquote>}
                  <figcaption className="mt-4 text-sm">
                    <span className="font-semibold text-ink">{r.author_name}</span>
                    <span className="block text-xs text-ink/45">{courseTitle.get(r.course_id)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-ink/10 py-8 text-center text-sm text-ink/40">
        © {new Date().getFullYear()} Tomora Academy · Courses are streamed for enrolled students and not downloadable.
      </footer>
    </div>
  );
}
