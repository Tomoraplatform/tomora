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

const initial: AuthState = {};

/** Password field with a show/hide eye toggle. */
function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
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

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState(signIn, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next || "/dashboard"} />
      <Feedback state={state} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@business.com" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-ink/60 hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="••••••••" />
      </div>
      <SubmitButton className="w-full" size="lg">Log In</SubmitButton>
      <p className="text-center text-sm text-ink/60">
        New to Tomora?{" "}
        <Link href="/signup" className="font-medium text-ink hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useFormState(signUp, initial);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required placeholder="Ada Obi" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@business.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required placeholder="At least 6 characters" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required placeholder="Re-enter your password" />
      </div>
      <SubmitButton className="w-full" size="lg">Create Account</SubmitButton>
      <p className="text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useFormState(requestPasswordReset, initial);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@business.com" />
      </div>
      <SubmitButton className="w-full" size="lg">Send Reset Link</SubmitButton>
      <p className="text-center text-sm text-ink/60">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ink hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
