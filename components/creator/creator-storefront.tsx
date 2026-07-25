import { BookOpen, GraduationCap } from "lucide-react";
import { contrastText, formatNaira } from "@/lib/utils";
import type { AcademyCreator, CreatorCourse } from "@/lib/creator/db";

/**
 * A creator's public storefront: their brand, bio and every live course.
 * Served at /c/<slug> and on their custom domain.
 */
export function CreatorStorefront({ creator, courses, hrefFor }: {
  creator: AcademyCreator;
  courses: (CreatorCourse & { lessonCount: number })[];
  hrefFor: (courseSlug: string) => string;
}) {
  const color = creator.brand_color || "#022245";
  const color2 = creator.brand_color_2 || "#10B981";
  const onColor = contrastText(color);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="px-5 py-14 sm:py-20" style={{ background: color, color: onColor }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          {creator.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.logo_url} alt={creator.brand_name || creator.author_name} className="h-16 w-16 shrink-0 rounded-xl bg-white/10 object-contain p-1.5" />
          ) : creator.show_author && creator.author_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.author_photo_url} alt={creator.author_name} className="h-20 w-20 shrink-0 rounded-full object-cover" />
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-4xl">{creator.brand_name || creator.author_name}</h1>
            {creator.author_bio && <p className="mt-3 max-w-2xl text-sm opacity-80 sm:text-base">{creator.author_bio}</p>}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="text-lg font-bold sm:text-xl">Courses</h2>
        {courses.length === 0 ? (
          <p className="mt-4 text-sm text-black/50">No courses published yet. Check back soon.</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <a key={c.id} href={hrefFor(c.slug)}
                className="flex flex-col overflow-hidden rounded-2xl border border-black/10 transition hover:shadow-lg">
                <div className="aspect-video bg-black/5">
                  {c.banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.banner_url} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : <div className="flex h-full items-center justify-center"><GraduationCap className="h-10 w-10 text-black/20" /></div>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-bold">{c.title}</h3>
                  {c.description && <p className="mt-1.5 line-clamp-2 text-sm text-black/55">{c.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                    <span className="inline-flex items-center gap-1 text-black/50"><BookOpen className="h-4 w-4" /> {c.lessonCount} lessons</span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-bold" style={{ color: color2 }}>{c.price > 0 ? formatNaira(c.price) : "Free"}</span>
                      {c.compare_price ? <span className="text-xs line-through text-black/35">{formatNaira(c.compare_price)}</span> : null}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-black/5 px-5 py-8 text-center text-sm text-black/45">
        © {new Date().getFullYear()} {creator.brand_name || creator.author_name}. Built with Tomora.
      </footer>
    </div>
  );
}
