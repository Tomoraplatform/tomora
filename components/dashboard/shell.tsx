"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Pencil, Palette, Package, ShoppingBag, Banknote,
  Globe, CreditCard, Settings, Menu, X, LogOut, ExternalLink, LayoutTemplate, Star, Inbox, MessagesSquare, Heart, Trophy, Ticket, Truck, MoreHorizontal, LifeBuoy, Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { SiteSwitcher, type SwitcherSite } from "./site-switcher";

const ICONS = {
  LayoutDashboard, Pencil, Palette, Package, ShoppingBag, Banknote, Globe, CreditCard, Settings, LayoutTemplate, Star, Inbox, MessagesSquare, Heart, Trophy, Ticket, Truck, LifeBuoy, Wallet,
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

export function DashboardShell({
  items,
  liveUrl,
  sites,
  currentSiteId,
  children,
}: {
  items: NavItem[];
  liveUrl?: string | null;
  sites?: SwitcherSite[];
  currentSiteId?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Logo /></div>
      {sites && currentSiteId && <SiteSwitcher sites={sites} currentId={currentSiteId} />}
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-ink text-cream" : "text-ink/70 hover:bg-ink/5"
              )}>
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active ? "bg-cream text-ink" : "bg-ink text-cream"
                )}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-ink/10 p-3">
        {liveUrl && (
          <a href={liveUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/70 hover:bg-ink/5">
            <ExternalLink className="h-[18px] w-[18px]" /> View Live Site
          </a>
        )}
        <form action={signOut}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/70 hover:bg-ink/5">
            <LogOut className="h-[18px] w-[18px]" /> Log Out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6 text-ink" /></button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 text-ink/50"><X className="h-5 w-5" /></button>
            {SidebarContent}
          </div>
        </div>
      )}

      <div className="lg:flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-ink/10 bg-white lg:block">
          {SidebarContent}
        </aside>
        <main className="min-w-0 flex-1 px-5 pb-28 pt-8 lg:px-10 lg:pb-8">{children}</main>
      </div>

      <MobileBottomNav items={items} pathname={pathname} onMore={() => setOpen(true)} />
    </div>
  );
}

/** App-style bottom tab bar on mobile. Shows key destinations + a "More" tab. */
function MobileBottomNav({ items, pathname, onMore }: { items: NavItem[]; pathname: string; onMore: () => void }) {
  const find = (href: string) => items.find((i) => i.href === href);
  const tabs = [
    find("/dashboard"),
    find("/dashboard/editor"),
    find("/dashboard/orders") || find("/dashboard/milestones"),
    find("/dashboard/messages"),
  ].filter(Boolean) as NavItem[];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          const short = item.label.split(" ")[0];
          return (
            <Link key={item.href} href={item.href}
              className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium", active ? "text-ink" : "text-ink/45")}>
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" />
                {item.badge ? <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[9px] font-semibold text-cream">{item.badge > 99 ? "99+" : item.badge}</span> : null}
              </span>
              {short}
            </Link>
          );
        })}
        <button onClick={onMore} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-ink/45">
          <MoreHorizontal className="h-[22px] w-[22px]" />
          More
        </button>
      </div>
    </nav>
  );
}
