import { LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support";

const SUPPORT_WHATSAPP = "2348105220236";

/**
 * Support block shown inside the student portal (below the course player and
 * on the portal home). Opens the student's mail app addressed to Academy
 * support with the context pre-filled.
 */
export function SupportCard({
  tone = "light", courseTitle, studentName, studentEmail,
}: {
  tone?: "light" | "dark";
  courseTitle?: string;
  studentName?: string;
  studentEmail?: string;
}) {
  const subject = courseTitle ? `Tomora Academy support | ${courseTitle}` : "Tomora Academy support";
  const body = [
    "Hi Tomora Academy support,",
    "",
    "", // student writes their message here
    "",
    "—",
    studentName ? `Student: ${studentName}` : null,
    studentEmail ? `Account email: ${studentEmail}` : null,
    courseTitle ? `Course: ${courseTitle}` : null,
  ].filter((l) => l !== null).join("\n");
  const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const waText = [
    "Hi Tomora Academy support,",
    studentName ? `I'm ${studentName}${studentEmail ? ` (${studentEmail})` : ""}.` : null,
    courseTitle ? `Course: ${courseTitle}` : null,
  ].filter((l) => l !== null).join(" ");
  const waHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(waText)}`;

  const dark = tone === "dark";
  return (
    <div className={`rounded-xl border p-5 ${dark ? "border-white/10 bg-white/5" : "border-ink/10 bg-white"}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <p className={`text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>Need help?</p>
            <p className={`text-xs ${dark ? "text-white/50" : "text-ink/50"}`}>
              Stuck on a lesson or having account issues? Send our support team a message and we&apos;ll get back to you.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1EBE5B]"
          >
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
          <a
            href={href}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              dark ? "bg-white text-[#101319] hover:bg-white/90" : "bg-ink text-cream hover:bg-ink/90"
            }`}
          >
            <Mail className="h-4 w-4" /> Message support
          </a>
        </div>
      </div>
      <p className={`mt-3 text-xs ${dark ? "text-white/30" : "text-ink/40"}`}>
        Or email us directly at <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2">{SUPPORT_EMAIL}</a>.
      </p>
    </div>
  );
}
