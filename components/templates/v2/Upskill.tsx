"use client";

import { useState } from "react";
import {
  Check, ChevronDown, Star, Briefcase, Code, Languages, Megaphone, DollarSign, Palette, Camera, FileText,
  Users, MessageSquare, Award,
} from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, BrandButton, Img } from "./shared";

const CATS = [
  { icon: Briefcase, t: "Business" }, { icon: Code, t: "Development" }, { icon: Languages, t: "Language" },
  { icon: Megaphone, t: "Marketing" }, { icon: DollarSign, t: "Finance" }, { icon: Palette, t: "Design" },
  { icon: Camera, t: "Photography" }, { icon: FileText, t: "Office" },
];
const ADV = [
  { t: "Relevant Skill Set", d: "Learn what employers actually hire for." },
  { t: "Growth Mindset", d: "Build habits that compound over time." },
  { t: "1-on-1 Mentoring", d: "Guidance from industry practitioners." },
  { t: "Hiring Partners", d: "Get introduced to companies hiring now." },
];
const FEATURES = [
  { icon: FileText, t: "CV & Resume Prep" }, { icon: MessageSquare, t: "Interview Coaching" },
  { icon: Users, t: "Buddy System" }, { icon: Award, t: "Career Opportunity" },
];
const FAQS = [
  ["How long is the program?", "Most bootcamps run 8–12 weeks with flexible evening cohorts."],
  ["Do I need prior experience?", "No — beginner tracks start from the fundamentals."],
  ["Is there a certificate?", "Yes, you receive a verified certificate on completion."],
  ["What support do I get?", "1-on-1 mentoring, a buddy system and career coaching."],
  ["Can I pay in installments?", "Yes, flexible payment plans are available via Paystack."],
];

export function Upskill({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "upskill.";
  const courses = siteData.courses || [];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-xl font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{["Home", "Course", "Bootcamp", "Blog", "Contact"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
          <div className="flex items-center gap-2"><a href="#" className="rounded-md border border-black/15 px-4 py-2 text-sm">Login</a><BrandButton className="px-4 py-2">Register</BrandButton></div>
        </div>
      </header>

      {/* Page header */}
      <section className="relative overflow-hidden bg-[#EEF3FF]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-14">
          <div><p className="text-sm text-black/50">Home / Bootcamp</p><h1 className="mt-2 text-4xl font-bold">{siteData.heroHeadline}</h1><p className="mt-3 max-w-md text-black/60">{siteData.heroSubtext}</p></div>
          <Img src={siteData.heroImage} className="hidden h-40 w-56 rounded-2xl object-cover lg:block" />
        </div>
      </section>

      {/* Category row */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {CATS.map(({ icon: Icon, t }) => (
            <div key={t} className="flex w-24 shrink-0 flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span>
              <span className="text-xs text-black/60">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Advantages */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">The Advantages of the {name} Program</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {ADV.map((a) => (
              <div key={a.t} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--brand-primary)" }} /><div><p className="font-semibold">{a.t}</p><p className="text-sm text-black/60">{a.d}</p></div></div>
            ))}
          </div>
        </div>
        <div className="relative"><div className="absolute inset-6 -z-0 rounded-3xl" style={{ background: "var(--brand-primary-light)" }} /><Img src="https://picsum.photos/seed/upskill-adv/700/600" className="relative z-10 aspect-[7/6] w-full rounded-3xl object-cover" /></div>
      </section>

      {/* Bootcamp program */}
      <section className="bg-[#EEF3FF]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-center text-3xl font-bold">Bootcamp Program</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative"><Img src={c.image} className="aspect-[4/3] w-full object-cover" /><span className="absolute left-3 top-3 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold">{c.level}</span></div>
                <div className="p-4">
                  <h3 className="font-semibold leading-snug">{c.title}</h3>
                  <p className="mt-1 text-sm text-black/50">{c.instructor} · {c.category}</p>
                  <div className="mt-2 flex items-center gap-1 text-sm" style={{ color: "var(--brand-primary)" }}><Star className="h-4 w-4 fill-current" />{c.rating}</div>
                  <a href="#" className="mt-3 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Start Learning →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, t }) => (
            <div key={t} className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-6 w-6" /></span>
              <h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-black/60">Support that gets you hired.</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#EEF3FF]">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <h2 className="text-center text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map(([q, a], i) => (
              <div key={i} className="rounded-xl bg-white">
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left font-medium">{q}<ChevronDown className={`h-5 w-5 transition-transform ${open === i ? "rotate-180" : ""}`} /></button>
                {open === i && <p className="px-5 pb-5 text-sm text-black/60">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div><p className="text-lg font-bold" style={{ color: "var(--brand-primary)" }}>{name}</p><p className="mt-2 text-black/50">Practical programs that get you hired.</p></div>
          {[["Company", ["About", "Careers", "Blog"]], ["Teaching", ["Courses", "Bootcamps", "Mentors"]], ["Community", ["Events", "Forum", "Partners"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-black/50">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="flex justify-center pb-3 pt-1"><SocialIcons social={siteData.social} className="opacity-70" /></div>
        <div className="border-t border-black/5 py-5 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
