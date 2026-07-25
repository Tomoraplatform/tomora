import { Check, Play } from "lucide-react";
import { contrastText, formatNaira } from "@/lib/utils";
import { toEmbedUrl } from "@/lib/creator/media";
import type { SalesPage, SalesSection } from "@/lib/creator/sales-page";
import type { AcademyCreator, CreatorCourseWithContent } from "@/lib/creator/db";

/**
 * Renders a creator's sales page. Every CTA points at the checkout for the
 * linked course (defaulting to this one). Layouts are mobile-first with no
 * overlapping elements; images are constrained and text wraps.
 */
export function SalesPageView({
  page, creator, course, ctaHref, children,
}: {
  page: SalesPage;
  creator: AcademyCreator;
  course: CreatorCourseWithContent;
  /** Builds the href for a CTA (checkout for this or another course). */
  ctaHref: (courseId?: string, url?: string) => string;
  /** Optional overlay (editor chrome). */
  children?: React.ReactNode;
}) {
  const color = page.color || creator.brand_color || "#022245";
  const color2 = page.color2 || creator.brand_color_2 || "#10B981";
  const onColor = contrastText(color);
  const onColor2 = contrastText(color2);
  const visible = page.sections.filter((s) => !s.hidden);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {children}
      {visible.map((s) => (
        <Section
          key={s.id} section={s} creator={creator} course={course}
          color={color} color2={color2} onColor={onColor} onColor2={onColor2} ctaHref={ctaHref}
        />
      ))}

      <footer className="border-t border-black/5 px-5 py-8 text-center text-sm text-black/45">
        © {new Date().getFullYear()} {creator.brand_name || creator.author_name}. Built with Tomora.
      </footer>
    </div>
  );
}

type Ctx = {
  section: SalesSection;
  creator: AcademyCreator;
  course: CreatorCourseWithContent;
  color: string; color2: string; onColor: string; onColor2: string;
  ctaHref: (courseId?: string, url?: string) => string;
};

function Cta({ section, color2, onColor2, ctaHref, className = "" }: Ctx & { className?: string }) {
  if (!section.cta?.label) return null;
  return (
    <a
      href={ctaHref(section.cta.courseId, section.cta.url)}
      className={`inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-base font-bold transition hover:opacity-90 ${className}`}
      style={{ background: color2, color: onColor2 }}
    >
      {section.cta.label}
    </a>
  );
}

function Section(ctx: Ctx) {
  const { section: s, creator, course, color, color2, onColor, onColor2, ctaHref } = ctx;

  switch (s.type) {
    case "hero":
      return (
        <section className="px-5 py-14 sm:py-20" style={{ background: color, color: onColor }}>
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            <div className="min-w-0">
              {creator.show_author && (
                <div className="mb-5 flex items-center gap-3">
                  {creator.author_photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={creator.author_photo_url} alt={creator.author_name} className="h-11 w-11 rounded-full object-cover" />
                  )}
                  <span className="text-sm opacity-80">{creator.author_name}</span>
                </div>
              )}
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">{s.heading}</h1>
              {s.subheading && <p className="mt-4 text-base opacity-80 sm:text-lg">{s.subheading}</p>}
              {s.body && <p className="mt-3 text-sm opacity-65 sm:text-base">{s.body}</p>}
              <div className="mt-7 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold">{course.price > 0 ? formatNaira(course.price) : "Free"}</span>
                {course.compare_price ? (
                  <span className="text-lg line-through opacity-50">{formatNaira(course.compare_price)}</span>
                ) : null}
              </div>
              <div className="mt-6"><Cta {...ctx} /></div>
            </div>
            {course.banner_url && (
              <div className="min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.banner_url} alt={course.title} className="w-full rounded-2xl object-cover shadow-2xl" />
              </div>
            )}
          </div>
        </section>
      );

    case "contains": {
      // Auto-fills from the curriculum: modules, or lessons when there's one module.
      const single = course.modules.length === 1;
      const entries = single
        ? course.modules[0].lessons.map((l, i) => ({ key: l.id, label: `Lesson ${i + 1}`, title: l.title, body: l.description }))
        : course.modules.map((m, i) => ({ key: m.id, label: `Module ${i + 1}`, title: m.title, body: m.lessons.map((l) => l.title).join(" · ") }));
      return (
        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">{s.heading}</h2>
            {s.subheading && <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-black/60 sm:text-base">{s.subheading}</p>}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((e) => (
                <div key={e.key} className="rounded-2xl border border-black/10 p-6">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: color2 }}>{e.label}</span>
                  <h3 className="mt-2 text-lg font-bold">{e.title}</h3>
                  {e.body && <p className="mt-2 line-clamp-3 text-sm text-black/55">{e.body}</p>}
                </div>
              ))}
              {entries.length === 0 && <p className="text-sm text-black/50">Lessons are being added.</p>}
            </div>
          </div>
        </section>
      );
    }

    case "outcomes":
      return (
        <section className="px-5 py-14 sm:py-16" style={{ background: color, color: onColor }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">{s.heading}</h2>
            <ul className="mt-9 space-y-3">
              {(s.items || []).map((it, i) => (
                <li key={it.id} className="flex items-start gap-3 rounded-xl bg-white/95 px-5 py-4 text-neutral-900">
                  <span className="text-xl font-extrabold" style={{ color: color2 }}>{i + 1}.</span>
                  <span className="min-w-0 pt-0.5 text-sm sm:text-base">{it.body}</span>
                </li>
              ))}
            </ul>
            {s.cta && <div className="mt-9 text-center"><Cta {...ctx} /></div>}
          </div>
        </section>
      );

    case "references":
      return (
        <section className="px-5 py-14 sm:py-16" style={{ background: `${color2}12` }}>
          <div className="mx-auto max-w-5xl text-center">
            {s.subheading && <p className="text-sm text-black/55">{s.subheading}</p>}
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{s.heading}</h2>
            {(s.images || []).length > 0 && (
              <div className="mt-9 grid gap-5 sm:grid-cols-2">
                {(s.images || []).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="w-full rounded-2xl object-cover" />
                ))}
              </div>
            )}
            {s.cta && <div className="mt-9"><Cta {...ctx} /></div>}
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section className="px-5 py-14 sm:py-16" style={{ background: color, color: onColor }}>
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">{s.heading}</h2>
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {(s.items || []).map((t) => (
                <figure key={t.id} className="rounded-2xl bg-white/95 p-6 text-neutral-900">
                  <blockquote className="text-sm leading-relaxed text-black/70">{t.body}</blockquote>
                  {t.title && <figcaption className="mt-3 text-sm font-semibold">{t.title}</figcaption>}
                </figure>
              ))}
              {(s.items || []).length === 0 && <p className="text-sm opacity-70">No feedback added yet.</p>}
            </div>
          </div>
        </section>
      );

    case "author":
      if (!creator.show_author) return null;
      return (
        <section className="px-5 py-14 sm:py-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            {creator.author_photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.author_photo_url} alt={creator.author_name} className="h-24 w-24 shrink-0 rounded-full object-cover" />
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">{s.heading}</h2>
              <p className="mt-1 font-semibold" style={{ color: color2 }}>{creator.author_name}</p>
              {creator.author_bio && <p className="mt-2 text-sm leading-relaxed text-black/60">{creator.author_bio}</p>}
            </div>
          </div>
        </section>
      );

    case "image":
      if (!s.image) return null;
      return (
        <section className="px-5 py-10">
          <div className="mx-auto max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" className="w-full rounded-2xl object-cover" />
          </div>
        </section>
      );

    case "imageText":
      return (
        <section className="px-5 py-14">
          <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="w-full rounded-2xl object-cover" />
            )}
            <div className="min-w-0">
              {s.heading && <h2 className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
              {s.body && <p className="mt-3 text-sm leading-relaxed text-black/60 sm:text-base">{s.body}</p>}
              {s.cta && <div className="mt-6"><Cta {...ctx} /></div>}
            </div>
          </div>
        </section>
      );

    case "video": {
      const embed = s.videoUrl ? toEmbedUrl(s.videoUrl) : null;
      if (!embed) return null;
      return (
        <section className="px-5 py-12">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-black">
            <iframe src={embed} title={s.heading || "Video"} allowFullScreen className="aspect-video w-full border-0" />
          </div>
        </section>
      );
    }

    case "videoText": {
      const embed = s.videoUrl ? toEmbedUrl(s.videoUrl) : null;
      return (
        <section className="px-5 py-14">
          <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2">
            {embed ? (
              <div className="overflow-hidden rounded-2xl bg-black">
                <iframe src={embed} title={s.heading || "Video"} allowFullScreen className="aspect-video w-full border-0" />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-black/5 text-black/30"><Play className="h-8 w-8" /></div>
            )}
            <div className="min-w-0">
              {s.heading && <h2 className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
              {s.body && <p className="mt-3 text-sm leading-relaxed text-black/60 sm:text-base">{s.body}</p>}
              {s.cta && <div className="mt-6"><Cta {...ctx} /></div>}
            </div>
          </div>
        </section>
      );
    }

    case "overlay":
      return (
        <section className="relative px-5 py-20 sm:py-24" style={{ background: color }}>
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          )}
          <div className="relative mx-auto max-w-3xl text-center" style={{ color: onColor }}>
            {s.heading && <h2 className="text-2xl font-bold sm:text-4xl">{s.heading}</h2>}
            {s.body && <p className="mx-auto mt-4 max-w-xl text-sm opacity-85 sm:text-base">{s.body}</p>}
            {s.cta && <div className="mt-7"><Cta {...ctx} /></div>}
          </div>
        </section>
      );

    case "imageButton":
      return (
        <section className="px-5 py-12">
          <div className="mx-auto max-w-4xl text-center">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="w-full rounded-2xl object-cover" />
            )}
            {s.cta && <div className="mt-7"><Cta {...ctx} /></div>}
          </div>
        </section>
      );

    case "cards":
      return (
        <section className="px-5 py-14">
          <div className="mx-auto max-w-6xl">
            {s.heading && <h2 className="text-center text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(s.items || []).map((it) => (
                <div key={it.id} className="flex flex-col overflow-hidden rounded-2xl border border-black/10">
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" className="aspect-video w-full object-cover" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {it.title && <h3 className="font-bold">{it.title}</h3>}
                    {it.body && <p className="mt-1.5 text-sm text-black/55">{it.body}</p>}
                    {it.cta?.label && (
                      <a href={ctaHref(it.cta.courseId, it.cta.url)}
                        className="mt-auto inline-flex items-center justify-center rounded-lg px-4 py-2.5 pt-2.5 text-sm font-bold"
                        style={{ background: color2, color: onColor2, marginTop: "1rem" }}>
                        {it.cta.label}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "button":
      return (
        <section className="px-5 py-10 text-center">
          <Cta {...ctx} />
        </section>
      );

    case "feature":
      return (
        <section className="px-5 py-14">
          <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="w-full rounded-2xl object-cover" />
            )}
            <div className="min-w-0">
              {s.heading && <h2 className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
              {s.body && <p className="mt-3 text-sm leading-relaxed text-black/60">{s.body}</p>}
              <ul className="mt-5 space-y-2">
                {(s.items || []).map((it) => (
                  <li key={it.id} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: color2 }} />
                    <span>{it.title || it.body}</span>
                  </li>
                ))}
              </ul>
              {s.cta && <div className="mt-6"><Cta {...ctx} /></div>}
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
}
