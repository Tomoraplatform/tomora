"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import type { Site } from "@/lib/database.types";
import { ChronovaShell } from "./chronova-shell";

const FAQS = [
  ["How do I track my order?", "You'll get a tracking link by email the moment your watch ships — follow it door to door."],
  ["What's your return policy?", "Any unworn watch can come back within 30 days for a full refund, no questions asked."],
  ["Do the watches come with a warranty?", "Yes — every timepiece includes our 2-year service warranty on the movement."],
  ["Can I change or cancel an order?", "As long as it hasn't shipped, just reply to your confirmation email and we'll sort it."],
];

export function ChronovaContact({ site, paystackEnabled }: { site: Site; paystackEnabled: boolean }) {
  const siteData = site.site_data;
  const brandColor = siteData?.brandColor || "#2E7DF6";
  const email = siteData?.email || "hello@chronova.com";

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending"); setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site.id, source: "contact", name: form.name, email: form.email,
          message: [form.subject && `Subject: ${form.subject}`, form.message].filter(Boolean).join(" — "),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not send. Please try again.");
      setStatus("done");
    } catch (err: any) {
      setError(err.message); setStatus("error");
    }
  }

  const cards = [
    { icon: Mail, title: "Email Us", sub: "We reply within 24 hours", value: email, action: "Send Email" },
    { icon: Phone, title: "Call Us", sub: "Mon – Fri, 9:00 – 18:00", value: siteData?.phone || "+234 800 000 0000", action: "Call Now" },
    { icon: MapPin, title: "Visit Us", sub: "Our flagship showroom", value: siteData?.address || "12 Marina Rd, Lagos", action: "Get Directions" },
    { icon: Clock, title: "Working Hours", sub: "We're available", value: "Mon – Fri, 9 – 18", action: "" },
  ];

  return (
    <ChronovaShell site={site} paystackEnabled={paystackEnabled}>
      <div className="bg-[#F3F3F2]">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Get in touch</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Contact Us</h1>
          <p className="mt-3 max-w-md text-neutral-500">Have a question about a watch, an order, or just want to say hello? Our team is here to help.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="rounded-2xl bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F3F2]"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-semibold">{c.title}</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">{c.sub}</p>
                  <p className="mt-3 text-sm font-semibold">{c.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
            {/* Form */}
            <div className="rounded-2xl bg-white p-8">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Message us</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Send a message</h2>
              {status === "done" ? (
                <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" /> Thanks — your message has been sent. We&apos;ll be in touch soon.
                </div>
              ) : (
                <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold">Full name</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-black/10 bg-[#F3F3F2] px-4 py-3 text-sm outline-none" placeholder="Ada Bello" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold">Email address</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-black/10 bg-[#F3F3F2] px-4 py-3 text-sm outline-none" placeholder="ada@example.com" />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-sm font-semibold">Subject</label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded-xl border border-black/10 bg-[#F3F3F2] px-4 py-3 text-sm outline-none">
                      <option value="">Select a subject</option><option>Order help</option><option>Product question</option><option>Something else</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-sm font-semibold">Message</label>
                    <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="min-h-[130px] rounded-xl border border-black/10 bg-[#F3F3F2] px-4 py-3 text-sm outline-none" placeholder="Tell us how we can help…" />
                  </div>
                  {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
                  <div className="sm:col-span-2">
                    <button disabled={status === "sending"} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#17181b" }}>
                      {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div className="rounded-2xl bg-white p-8">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Common questions</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">FAQs</h2>
              <div className="mt-5 space-y-2.5">
                {FAQS.map(([q, a], i) => (
                  <div key={i} className="rounded-xl border border-black/10 px-4">
                    <button type="button" onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 py-4 text-left text-sm font-semibold">
                      {q}<ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
                    </button>
                    {open === i && <p className="pb-4 text-sm text-neutral-500">{a}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-[#F3F3F2] p-5 text-center">
                <p className="text-sm font-semibold">Still need help?</p>
                <p className="mt-1 text-xs text-neutral-500">Our team is available Mon – Fri, 9:00 – 18:00.</p>
                <a href={`mailto:${email}`} className="mt-3 inline-block rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold" style={{ color: brandColor }}>{email}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChronovaShell>
  );
}
