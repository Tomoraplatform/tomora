import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { Site } from "@/lib/database.types";
import { ChronovaShell } from "./chronova-shell";

/** Chronova live About page, brand story, stats, values, CTA. */
export function ChronovaAbout({ site, paystackEnabled }: { site: Site; paystackEnabled: boolean }) {
  const siteData = site.site_data;
  const name = siteData?.businessName || "Chronova";
  const brandColor = siteData?.brandColor || "#2E7DF6";

  const stats = [["2012", "Year Founded"], ["40K+", "Happy Clients"], ["90+", "Brands Curated"], ["24", "Countries Served"]];
  const values = siteData?.services?.length
    ? siteData.services
    : [
        { id: "v0", title: "Authenticity", description: "Every timepiece is checked by our watchmakers before it reaches your wrist." },
        { id: "v1", title: "Craft", description: "We obsess over the details most shops overlook | movement, finish and feel." },
        { id: "v2", title: "Service", description: "White-glove support and insured delivery, from first click to final fitting." },
      ];

  return (
    <ChronovaShell site={site} paystackEnabled={paystackEnabled}>
      <div className="bg-[#F3F3F2]">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col justify-center rounded-2xl bg-[#17181b] p-9 text-white">
              <p className="text-[11px] uppercase tracking-widest text-white/50">About {name}</p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">We live &amp; breathe watches.</h1>
              <p className="mt-4 max-w-md text-white/70">{siteData?.sectionText?.about || "A decade of quiet obsession, distilled into a shop for people who love a good timepiece as much as we do."}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/shop" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900">Shop the Collection</Link>
                <Link href="/contact" className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white">Contact Us</Link>
              </div>
            </div>
            <div className="min-h-[300px] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url('${siteData?.heroImage || "https://picsum.photos/seed/chronova-about/900/900"}')` }} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(([b, s], i) => (
              <div key={i} className={`rounded-2xl p-6 ${i === 0 ? "bg-[#17181b] text-white" : "bg-white"}`}>
                <p className="text-3xl font-bold tracking-tight">{b}</p>
                <p className={`mt-1 text-xs ${i === 0 ? "text-white/70" : "text-neutral-500"}`}>{s}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What drives us</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div key={v.id} className="rounded-2xl bg-white p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F3F2]"><ShieldCheck className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-semibold">{v.title}</h3>
                  {v.description && <p className="mt-2 text-sm text-neutral-500">{v.description}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-3xl bg-[#17181b] p-14 text-center text-white">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Find your next watch</h2>
            <p className="mx-auto mt-3 max-w-md text-white/70">Browse our curated collection, every piece checked, serviced and shipped with care.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900">Shop Now</Link>
              <Link href="/contact" className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: brandColor }}>Talk to an Expert</Link>
            </div>
          </div>
        </div>
      </div>
    </ChronovaShell>
  );
}
