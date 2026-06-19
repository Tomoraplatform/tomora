"use client";

import { PlayCircle, HandHeart, Wallet, HeartHandshake, GraduationCap, Droplet, Utensils, Stethoscope, MapPin } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, servicesOf, SocialIcons, BrandButton, Img, formatNaira } from "./shared";

const ACTIONS = [{ icon: HeartHandshake, t: "Become a Volunteer" }, { icon: Wallet, t: "Quick Fundraising" }, { icon: HandHeart, t: "Start Donating" }];
const WHATWEDO = [{ icon: GraduationCap, t: "Kids Education" }, { icon: Droplet, t: "Pure Water" }, { icon: Utensils, t: "Healthy Food" }, { icon: Stethoscope, t: "Medical Care" }];

export function Charius({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Charius";
  const causes = siteData.causes || [];
  const events = siteData.events || [];

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <div className="bg-[#0D0D0D] py-2 text-center text-xs text-white/80">Join our upcoming campaign — every gift counts</div>
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{["Home", "Donations", "Events", "Blog", "Contact"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
          <BrandButton className="px-4 py-2">Donate Now</BrandButton>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <div>
          <span className="font-semibold" style={{ color: "var(--brand-primary)" }}>Give them a chance.</span>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">{siteData.heroHeadline}</h1>
          <p className="mt-4 max-w-md text-black/60">{siteData.heroSubtext}</p>
          <div className="mt-6 flex items-center gap-4">
            <BrandButton as="a" href={siteData.ctaHref || "#"}><PlayCircle className="h-4 w-4" /> {siteData.ctaText || "Join Our Campaign"}</BrandButton>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">{[0,1,2,3].map((i) => <Img key={i} src={`https://picsum.photos/seed/ch-vol${i}/64`} className="h-9 w-9 rounded-full border-2 border-white object-cover" />)}</div>
            <span className="text-sm text-black/50">120+ Happy Volunteers</span>
          </div>
        </div>
        <Img src={siteData.heroImage} className="aspect-square w-full rounded-[2rem] object-cover" />
      </section>

      {/* Quick actions */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="grid gap-5 sm:grid-cols-3">
          {ACTIONS.map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center gap-4 rounded-2xl border border-black/10 p-5"><span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span><div><p className="font-semibold">{t}</p><p className="text-sm text-black/50">Get started today</p></div></div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">{[0,1,2,3].map((i) => <Img key={i} src={`https://picsum.photos/seed/ch-about${i}/400`} className="aspect-square w-full rounded-2xl object-cover" />)}</div>
        <div>
          <span className="font-semibold" style={{ color: "var(--brand-primary)" }}>Welcome to {name}</span>
          <h2 className="mt-2 text-3xl font-bold">You&apos;re the Hope of Others.</h2>
          <p className="mt-3 text-black/60">We work hand-in-hand with local communities to deliver education, clean water, food and medical care where it is needed most.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[["Our Mission", "Empower communities to thrive."], ["Our Vision", "A future with opportunity for all."]].map(([t, d]) => (
              <div key={t} className="rounded-xl bg-[#FBF8F2] p-4"><p className="font-semibold">{t}</p><p className="text-sm text-black/60">{d}</p></div>
            ))}
          </div>
          <a href="#" className="mt-5 inline-block rounded-md border-2 px-6 py-3 text-sm font-semibold" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}>Discover More</a>
        </div>
      </section>

      {/* Causes */}
      <section className="bg-[#FBF8F2]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-bold">Our Causes</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {causes.slice(0, 3).map((c) => {
              const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
              return (
                <div key={c.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <Img src={c.image} className="aspect-[4/3] w-full object-cover" />
                  <div className="p-5">
                    <h3 className="font-semibold">{c.title}</h3><p className="mt-1 text-sm text-black/60">{c.description}</p>
                    <div className="mt-4 h-2 rounded-full bg-black/10"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand-primary)" }} /></div>
                    <div className="mt-2 flex justify-between text-sm text-black/60"><span>Raised: {formatNaira(c.raised)}</span><span>Goal: {formatNaira(c.goal)}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact band */}
      <section className="bg-[#0D0D0D] py-16 text-center text-white"><h2 className="mx-auto max-w-2xl px-5 text-3xl font-bold">Your Donation Means Another Smile.</h2></section>

      {/* What we do */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold">What We Do</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {servicesOf(siteData, WHATWEDO.map((s) => ({ title: s.t }))).map((s, i) => {
            const Icon = WHATWEDO[i % WHATWEDO.length].icon;
            return (
              <div key={i} className="rounded-2xl border border-black/10 p-6 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-6 w-6" /></span><h3 className="mt-3 font-semibold">{s.title}</h3>{s.description ? <p className="mt-1 text-sm text-black/60">{s.description}</p> : null}</div>
            );
          })}
        </div>
      </section>

      {/* Events */}
      <section className="bg-[#FBF8F2]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-bold">Join Our Upcoming Events</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {events.slice(0, 3).map((e) => (
              <div key={e.id} className="overflow-hidden rounded-2xl bg-white shadow-sm"><Img src={e.image} className="aspect-[4/3] w-full object-cover" /><div className="p-5"><span className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>{e.date}</span><h3 className="mt-1 font-semibold">{e.title}</h3><p className="mt-1 flex items-center gap-1 text-sm text-black/50"><MapPin className="h-4 w-4" />{e.location}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#0D0D0D] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2"><p className="text-lg font-bold">{name}</p><p className="mt-2 max-w-xs text-sm text-white/50">Bringing hope, education and care to those who need it most.</p><SocialIcons social={siteData.social} className="mt-4 text-white/70" /></div>
          {[["About", ["Story", "Team", "Reports"]], ["Quick Links", ["Donate", "Volunteer", "Events"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="text-sm font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-sm text-white/50">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
