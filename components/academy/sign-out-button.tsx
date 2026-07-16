"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutStudent } from "@/app/academy/actions";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await signOutStudent(); router.push("/academy"); router.refresh(); }}
      className="rounded-md p-2 text-ink/50 hover:bg-ink/5 hover:text-ink"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
