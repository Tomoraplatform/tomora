"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { TOMIVO_PLANS, TOMIVO_PERKS } from "@/lib/tomivo/constants";
import { signUp, signIn, subscribe } from "@/app/tomora-ai/designs/actions";

type Plan = "monthly" | "yearly";

export function SubscribePanel({ signedIn, subscribed }: { signedIn: boolean; subscribed: boolean }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function startSubscribe(chosen: Plan) {
    setPlan(chosen);
    if (!signedIn) { setAuthOpen(true); return; }
    setBusy(true);
    const res = await subscribe(chosen);
    setBusy(false);
    if (res.ok && res.url) { window.location.href = res.url; return; }
    window.alert(res.error || "Could not start checkout.");
  }

  if (subscribed) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"><Check className="h-6 w-6" /></span>
        <h3 className="mt-3 text-xl font-bold text-white">You&apos;re subscribed</h3>
        <p className="mt-1 text-white/55">Every Pro design is unlocked. Copy any prompt, HTML or CSS you like.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 md:grid-cols-2">
        {(["monthly", "yearly"] as Plan[]).map((id) => {
          const p = TOMIVO_PLANS[id];
          const popular = id === "yearly";
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                popular ? "border-amber-400/40 bg-amber-400/[0.05]" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {popular && (
                <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-[#101319]">
                  <Crown className="h-3 w-3" /> Best value
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{p.label}</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-white">${p.usd}</span>
                <span className="text-white/50">/{p.per}</span>
              </div>
              <p className="mt-1 text-xs text-white/40">Billed in Naira (₦{p.ngn.toLocaleString()}) via Paystack.</p>

              <ul className="mt-6 flex-1 space-y-3">
                {TOMIVO_PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {perk}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => startSubscribe(id)}
                disabled={busy}
                className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition ${
                  popular ? "bg-amber-400 text-[#101319] hover:bg-amber-300" : "bg-white text-[#101319] hover:bg-white/90"
                } disabled:opacity-60`}
              >
                {busy && plan === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Subscribe {p.label.toLowerCase()}
              </button>
            </div>
          );
        })}
      </div>

      {authOpen && (
        <AuthModal
          plan={plan}
          onClose={() => setAuthOpen(false)}
          onAuthed={async () => {
            setAuthOpen(false);
            setBusy(true);
            const res = await subscribe(plan);
            setBusy(false);
            if (res.ok && res.url) window.location.href = res.url;
            else { window.alert(res.error || "Could not start checkout."); router.refresh(); }
          }}
        />
      )}
    </div>
  );
}

function AuthModal({ plan, onClose, onAuthed }: { plan: Plan; onClose: () => void; onAuthed: () => void }) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = mode === "register"
      ? await signUp({ name: form.name, email: form.email, password: form.password })
      : await signIn({ email: form.email, password: form.password });
    setBusy(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    onAuthed();
  }

  const input = "w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0e13] p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white">{mode === "register" ? "Create your account" : "Welcome back"}</h3>
        <p className="mt-1 text-sm text-white/50">One Tomora account for the {TOMIVO_PLANS[plan].label.toLowerCase()} plan. Continue to secure Paystack checkout.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "register" && (
            <input className={input} placeholder="Your name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
          )}
          <input className={input} type="email" placeholder="Email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={input} type="password" placeholder={mode === "register" ? "Set a password (min 8 characters)" : "Password"} value={form.password} required minLength={mode === "register" ? 8 : 6} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#101319] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continue to payment
          </button>
        </form>
        <button onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(null); }} className="mt-4 w-full text-center text-xs text-white/50 hover:text-white">
          {mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
