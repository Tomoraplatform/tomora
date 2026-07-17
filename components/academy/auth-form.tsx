"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signUpStudent, signInStudent, purchaseCourse } from "@/app/academy/actions";

/**
 * Register / sign-in form for academy students. When `courseId` is present
 * (they clicked Purchase while signed out), the purchase continues
 * immediately after authentication.
 */
export function AcademyAuthForm({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = mode === "register"
      ? await signUpStudent(form)
      : await signInStudent({ email: form.email, password: form.password });
    if (!res.ok) { setError(res.error || "Something went wrong."); setBusy(false); return; }

    if (courseId) {
      const buy = await purchaseCourse(courseId);
      if (buy.ok && buy.url) { window.location.href = buy.url; return; }
    }
    router.push("/academy/portal");
    router.refresh();
  }

  const input = "w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-ink/40";

  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex rounded-lg bg-ink/5 p-1">
        {(["register", "login"] as const).map((m) => (
          <button
            key={m} type="button" onClick={() => { setMode(m); setError(null); }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${mode === m ? "bg-white text-ink shadow-sm" : "text-ink/50"}`}
          >
            {m === "register" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <input className={input} placeholder="Full name" value={form.name} required
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        )}
        <input className={input} type="email" placeholder="Email address" value={form.email} required
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className={input} type="password" placeholder={mode === "register" ? "Set a password (min 8 characters)" : "Password"} value={form.password} required minLength={mode === "register" ? 8 : 6}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3 text-sm font-semibold text-cream disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "register" ? (courseId ? "Create account & continue" : "Create account") : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-ink/50">
        You&apos;ll access your portal with the email you register with.
      </p>
    </div>
  );
}
