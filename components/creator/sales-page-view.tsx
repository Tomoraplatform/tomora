import { Check, Play, ArrowRight, MonitorPlay, MessagesSquare, Download } from "lucide-react";
import { contrastText, formatNaira } from "@/lib/utils";
import { toEmbedUrl } from "@/lib/creator/embed";
import type { SalesPage, SalesSection } from "@/lib/creator/sales-page";
import type { AcademyCreator, CreatorCourseWithContent } from "@/lib/creator/db";

/** The template's display face. Applied directly because the project's
 *  `font-serif` utility points at a CSS variable that isn't defined. */
const DISPLAY = { fontFamily: 'Georgia, "Times New Roman", Times, serif' } as const;

/**
 * Renders a creator's sales page. Mobile is centre-aligned throughout and
 * opens out to the two-column layout from the template on large screens.
 * Every CTA points at checkout for the linked course (defaulting to this one).
 */
export function SalesPageView({
  page, creator, course, ctaHref, children,
}: {
  page: SalesPage;
  creator: AcademyCreator;
  course: CreatorCourseWithContent;
  ctaHref: (courseId?: string, url?: string) => string;
  children?: React.ReactNode;
}) {
  const color = page.color || creator.brand_color || "#242B3D";
  const color2 = page.color2 || creator.brand_color_2 || "#F3E969";
  const onColor = contrastText(color);
  const onColor2 = contrastText(color2);
  const visible = page.sections.filter((s) => !s.hidden);
  const hasHero = visible.some((s) => s.type === "hero");

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-900">
      {children}

      {/* Brand bar sits on the hero's dark background when there is one. */}
      <div className={hasHero ? "relative z-10 -mb-px" : ""} style={hasHero ? { background: color } : undefined}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pt-6 sm:pt-8">
          <span className="flex min-w-0 items-center gap-2.5">
            {creator.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.logo_url} alt={creator.brand_name || creator.author_name} className="h-9 w-auto max-w-[150px] object-contain" />
            ) : (
              <span style={{ ...DISPLAY, color: hasHero ? onColor : undefined }} className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {creator.brand_name || creator.author_name}
              </span>
            )}
          </span>
          <a
            href={ctaHref()}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-bold sm:text-sm"
            style={{ background: hasHero ? onColor : color, color: hasHero ? color : onColor }}
          >
            Get Access
          </a>
        </div>
      </div>

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

/** The yellow pill CTA from the template. */
function Cta({ section, color2, onColor2, ctaHref, className = "" }: Ctx & { className?: string }) {
  if (!section.cta?.label) return null;
  return (
    <a
      href={ctaHref(section.cta.courseId, section.cta.url)}
      className={`inline-flex items-center justify-center rounded-lg px-8 py-3.5 text-base font-bold shadow-sm transition hover:opacity-90 ${className}`}
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
        <section className="px-5 pb-14 pt-10 sm:pb-20 lg:rounded-br-[3.5rem]" style={{ background: color, color: onColor }}>
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            {/* Centre on mobile, left-align from lg up. */}
            <div className="min-w-0 text-center lg:text-left">
              {creator.show_author && creator.author_photo_url && (
                <div className="mb-5 flex items-center justify-center gap-3 lg:justify-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={creator.author_photo_url} alt={creator.author_name} className="h-11 w-11 rounded-full object-cover" />
                  <span className="text-sm opacity-80">{creator.author_name}</span>
                </div>
              )}
              <h1 style={DISPLAY} className="text-[1.75rem] font-bold leading-[1.2] sm:text-4xl lg:text-[2.6rem]">{s.heading}</h1>
              {s.subheading && <p className="mx-auto mt-4 max-w-xl text-sm opacity-75 sm:text-base lg:mx-0">{s.subheading}</p>}
              {s.body && <p className="mx-auto mt-3 max-w-xl text-sm opacity-60 lg:mx-0">{s.body}</p>}

              <div className="mt-7 flex flex-wrap items-baseline justify-center gap-3 lg:justify-start">
                <span style={DISPLAY} className="text-3xl font-bold italic sm:text-4xl">
                  {course.price > 0 ? formatNaira(course.price) : "Free"}
                </span>
                {course.compare_price ? (
                  <span className="text-lg line-through opacity-45">{formatNaira(course.compare_price)}</span>
                ) : null}
              </div>
              <div className="mt-6"><Cta {...ctx} /></div>
            </div>

            {course.banner_url && (
              <div className="min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.banner_url} alt={course.title}
                  className="mx-auto w-full max-w-md rounded-2xl object-cover shadow-2xl lg:max-w-none lg:rotate-2" />
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
        <section className="px-5 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl text-center">
            <h2 style={DISPLAY} className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>
            {s.subheading && <p className="mx-auto mt-3 max-w-lg text-sm text-black/55 sm:text-base">{s.subheading}</p>}
            <div className="mt-10 grid gap-5 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-3">
              {entries.map((e) => (
                <div key={e.key} className="rounded-xl border border-black/15 p-6">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: pickLabelColor(color2) }}>{e.label}</span>
                  <h3 style={DISPLAY} className="mt-2 text-xl font-bold">{e.title}</h3>
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
        <section className="px-5 py-14 sm:py-20 lg:rounded-tl-[3.5rem]" style={{ background: color, color: onColor }}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 style={DISPLAY} className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>
            <ul className="mt-9 space-y-3 text-left">
              {(s.items || []).map((it, i) => (
                <li key={it.id} className="flex items-start gap-3 rounded-xl bg-white px-5 py-3.5 text-neutral-900">
                  <span style={DISPLAY} className="text-2xl font-bold leading-none">{i + 1}.</span>
                  <span className="min-w-0 pt-1 text-sm sm:text-base">{it.body}</span>
                </li>
              ))}
            </ul>
            {s.cta && <div className="mt-9"><Cta {...ctx} /></div>}
          </div>
        </section>
      );

    case "references":
      return (
        <section className="px-5 py-14 sm:py-20" style={{ background: tint(color2) }}>
          <div className="mx-auto max-w-5xl text-center">
            {s.subheading && <p className="text-sm text-black/60">{s.subheading}</p>}
            <h2 style={DISPLAY} className="mt-1 text-2xl font-bold sm:text-3xl">{s.heading}</h2>
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

    case "feature": {
      const links = (s.items || []).slice(0, 4);
      return (
        <section className="px-5 py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            {(s.image || course.banner_url) && (
              <div className="min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image || course.banner_url!} alt="" className="mx-auto w-full max-w-md rounded-2xl object-cover shadow-xl lg:max-w-none" />
              </div>
            )}
            <div className="min-w-0 text-center lg:text-left">
              {s.subheading && (
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: pickLabelColor(color2) }}>
                  {s.subheading}
                </p>
              )}
              {s.heading && <h2 style={DISPLAY} className="mt-2 text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
              {s.body && <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-black/60 lg:mx-0">{s.body}</p>}

              {links.length > 0 && (
                <div className="mt-6 space-y-3">
                  {links.map((it, i) => (
                    <div key={it.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-left">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
                        {i % 2 === 0 ? <MonitorPlay className="h-4 w-4 text-black/55" /> : <MessagesSquare className="h-4 w-4 text-black/55" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        {it.title && <span className="block text-sm font-semibold" style={{ color: pickLabelColor(color2) }}>{it.title}</span>}
                        {it.body && <span className="block text-xs text-black/55">{it.body}</span>}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-black/35" />
                    </div>
                  ))}
                </div>
              )}
              {s.cta && <div className="mt-7"><Cta {...ctx} /></div>}
            </div>
          </div>
        </section>
      );
    }

    case "testimonials":
      return (
        <section className="px-5 py-14 sm:py-20 lg:rounded-tl-[3.5rem]" style={{ background: color, color: onColor }}>
          <div className="mx-auto max-w-5xl text-center">
            <h2 style={DISPLAY} className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>
            <div className="mt-9 grid gap-5 text-left sm:grid-cols-2">
              {(s.items || []).map((t) => (
                <figure key={t.id} className="rounded-xl bg-neutral-200 p-6 text-neutral-900">
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
              <h2 style={DISPLAY} className="text-xl font-bold sm:text-2xl">{s.heading}</h2>
              <p className="mt-1 font-semibold" style={{ color: pickLabelColor(color2) }}>{creator.author_name}</p>
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
              <img src={s.image} alt="" className="mx-auto w-full max-w-md rounded-2xl object-cover lg:max-w-none" />
            )}
            <div className="min-w-0 text-center lg:text-left">
              {s.heading && <h2 style={DISPLAY} className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
              {s.body && <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-black/60 sm:text-base lg:mx-0">{s.body}</p>}
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
            <div className="min-w-0 text-center lg:text-left">
              {s.heading && <h2 style={DISPLAY} className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
              {s.body && <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-black/60 sm:text-base lg:mx-0">{s.body}</p>}
              {s.cta && <div className="mt-6"><Cta {...ctx} /></div>}
            </div>
          </div>
        </section>
      );
    }

    case "overlay":
      return (
        <section className="relative overflow-hidden px-5 py-20 sm:py-24" style={{ background: color }}>
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          )}
          <div className="relative mx-auto max-w-3xl text-center" style={{ color: onColor }}>
            {s.heading && <h2 style={DISPLAY} className="text-2xl font-bold sm:text-4xl">{s.heading}</h2>}
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
          <div className="mx-auto max-w-6xl text-center">
            {s.heading && <h2 style={DISPLAY} className="text-2xl font-bold sm:text-3xl">{s.heading}</h2>}
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(s.items || []).map((it) => (
                <div key={it.id} className="flex flex-col overflow-hidden rounded-2xl border border-black/10">
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" className="aspect-video w-full object-cover" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {it.title && <h3 style={DISPLAY} className="text-lg font-bold">{it.title}</h3>}
                    {it.body && <p className="mt-1.5 text-sm text-black/55">{it.body}</p>}
                    {it.cta?.label && (
                      <a href={ctaHref(it.cta.courseId, it.cta.url)}
                        className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold"
                        style={{ background: color2, color: onColor2 }}>
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

    default:
      return null;
  }
}

/** Yellow accents are unreadable as text, so labels fall back to a dark tone. */
function pickLabelColor(hex: string): string {
  return contrastText(hex) === "#000000" ? "#9a8c1f" : hex;
}

/** A very light wash of the accent colour for alternating section backgrounds. */
function tint(hex: string): string {
  return `${hex}1f`;
}
