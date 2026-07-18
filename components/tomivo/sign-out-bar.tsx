"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/tomora-ai/designs/actions";

export function SignOutBar({ name }: { name: string | null }) {
  const router = useRouter();
  if (!name) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-white/50">
      <span className="hidden sm:inline">{name.split(" ")[0]}</span>
      <button
        onClick={async () => { await signOut(); router.refresh(); }}
        className="rounded-md border border-white/15 px-2.5 py-1 font-medium hover:text-white"
      >
        Sign out
      </button>
    </div>
  );
}
