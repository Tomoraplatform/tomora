"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import {
  signIn,
  signUp,
  requestPasswordReset,
  type AuthState,
} from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "./submit-button";
import { SocialAuth } from "./social-auth";
import { PandaGuardian, type PandaMood } from "./panda-guardian";

const initial: AuthState = {};

/**
 * The panda's state, derived from what the person is doing with the form.
 *
 * Kept in one place so login, signup and the reset form all behave the same:
 * the character is part of the interface, not decoration bolted onto each page.
 */
function usePanda(state: AuthState) {
  const [field, setField] = useState<"none" | "email" | "password">("none");
  const [look, setLook] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const mood: PandaMood = state.error
    ? "error"
    : state.message
    ? "success"
    : field === "password"
    ? revealed ? "peeking" : "hiding"
    : field === "email"
    ? "typing"
    : "idle";

  /** Attach to the email box so the eyes track along the text. */
  const emailProps = {
    onFocus: () => setField("email"),
    onBlur: () => setField((f) => (f === "email" ? "none" : f)),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      // Sweep left to right across roughly the width of a typed address.
      const t = Math.min(1, e.target.value.length / 22);
      setLook(t * 2 - 1);
    },
  };

  /** Attach to any password box so the paws come up. */
  const secretProps = {
    onFocus: () => setField("password"),
    onBlur: () => setField((f) => (f === "password" ? "none" : f)),
    onReveal: setRevealed,
  };

  return { mood, look, emailProps, secretProps };
}

/** Password field with a show/hide eye toggle, which the panda also reacts to. */
function PasswordInput({
  onReveal,
  onFocus,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { onReveal?: (shown: boolean) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        // Signup has two of these. Reporting this field's own state on focus
        // keeps the panda in step with the box actually being typed into,
        // rather than whichever one was revealed last.
        onFocus={(e) => { onReveal?.(show); onFocus?.(e); }}
        type={show ? "text" : "password"}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => {
          const next = !show;
          setShow(next);
          onReveal?.(next);
        }}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Feedback({ state }: { state: AuthState }) {
  if (state.error)
    return (
      <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{state.error}</span>
      </div>
    );
  if (state.message)
    return (
      <div className="flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{state.message}</span>
      </div>
    );
  return null;
}

/**
 * The panda above, the form below, overlapping slightly so the two read as one
 * object rather than an illustration sitting on top of a box.
 */
function AuthPanel({
  mood, look, title, subtitle, children,
}: {
  mood: PandaMood;
  look: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <PandaGuardian mood={mood} look={look} className="relative z-0 mx-auto -mb-10 h-52 w-auto sm:h-60" />
      <div className="relative z-10 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] sm:p-7">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink/60">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState(signIn, initial);
  const { mood, look, emailProps, secretProps } = usePanda(state);

  return (
    <AuthPanel mood={mood} look={look} title="Welcome back" subtitle="Log in to manage your Tomora site.">
      <div className="space-y-4">
        <SocialAuth next={next || "/dashboard"} />
        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={next || "/dashboard"} />
          <Feedback state={state} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@business.com" {...emailProps} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-ink/60 hover:text-ink">
                Forgot password?
              </Link>
            </div>
            <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="••••••••" {...secretProps} />
          </div>
          <SubmitButton className="w-full" size="lg">Log In</SubmitButton>
          <p className="text-center text-sm text-ink/60">
            New to Tomora?{" "}
            <Link href="/signup" className="font-medium text-ink hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </AuthPanel>
  );
}

export function SignupForm() {
  const [state, action] = useFormState(signUp, initial);
  const { mood, look, emailProps, secretProps } = usePanda(state);

  return (
    <AuthPanel mood={mood} look={look} title="Start free for 14 days" subtitle="No credit card required. Go live in minutes.">
      <div className="space-y-4">
        <SocialAuth next="/dashboard" />
        <form action={action} className="space-y-4">
          <Feedback state={state} />
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required placeholder="Ada Obi" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@business.com" {...emailProps} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" name="password" autoComplete="new-password" required placeholder="At least 6 characters" {...secretProps} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required placeholder="Re-enter your password" {...secretProps} />
          </div>
          <SubmitButton className="w-full" size="lg">Create Account</SubmitButton>
          <p className="text-center text-sm text-ink/60">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-ink hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </AuthPanel>
  );
}

export function ForgotForm() {
  const [state, action] = useFormState(requestPasswordReset, initial);
  const { mood, look, emailProps } = usePanda(state);

  return (
    <AuthPanel mood={mood} look={look} title="Reset your password" subtitle="We&rsquo;ll email you a secure reset link.">
      <form action={action} className="space-y-4">
        <Feedback state={state} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@business.com" {...emailProps} />
        </div>
        <SubmitButton className="w-full" size="lg">Send Reset Link</SubmitButton>
        <p className="text-center text-sm text-ink/60">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-ink hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthPanel>
  );
}
