import { MessageCircle } from "lucide-react";

/** WhatsApp community invite. `href` comes from app_settings. */
export function WhatsAppCard({ href }: { href: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface-warm to-accent-soft/50 p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#1f9d52]">
          <MessageCircle size={22} />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-bold tracking-tight">
            Join the community
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Join the WhatsApp community for support, updates, and accountability.
          </p>
          <a
            href={href || "#"}
            target={href && href !== "#" ? "_blank" : undefined}
            rel="noreferrer"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-[15px] font-semibold text-white shadow-card transition-all hover:brightness-95 hover:shadow-lift"
          >
            <MessageCircle size={18} /> Join WhatsApp Community
          </a>
        </div>
      </div>
    </div>
  );
}
