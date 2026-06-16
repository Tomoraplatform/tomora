"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Pencil, Palette, Package, ShoppingBag, Banknote,
  Globe, CreditCard, Settings, Menu, X, LogOut, ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";

const ICONS = {
  LayoutDashboard, Pencil, Palette, Package, ShoppingBag, Banknote, Globe, CreditCard, Settings,
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

export function DashboardShell({
  items,
  businessName,
  liveUrl,
  children,
}: {
  items: NavItem[];
  businessName: string;
  liveUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Logo /></div>
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
              {item.label}
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
        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
