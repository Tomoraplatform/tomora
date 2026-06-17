"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2, CircleCheck, CircleAlert } from "lucide-react";

type State =
  | { kind: "loading" }
  | { kind: "success"; email?: string }
  | { kind: "failed"; message: string }
  | { kind: "error"; message: string };

export function PaymentVerifier() {
  const params = useSearchParams();
  const reference = params.get("reference") || params.get("trxref");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!reference) {
      setState({
        kind: "error",
        message:
          "We could not verify this payment yet. Please contact support or try again.",
      });
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();
        if (data.status === "success") {
          setState({ kind: "success", email: data.email });
        } else if (data.status === "failed" || data.status === "mismatch") {
          setState({ kind: "failed", message: data.message });
        } else {
          setState({ kind: "error", message: data.message });
        }
      } catch {
        setState({
          kind: "error",
          message:
            "We could not verify this payment yet. Please contact support or try again.",
        });
      }
    })();
  }, [reference]);

  if (state.kind === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="animate-spin text-accent" size={36} />
        <p className="text-muted">Confirming your payment…</p>
      </div>
    );
  }

  if (state.kind === "success") {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf2e6] text-success">
          <CircleCheck size={34} />
        </span>
        <h1 className="mt-5 font-editorial text-2xl font-semibold tracking-tight sm:text-3xl">
          Payment confirmed
        </h1>
        <p className="mt-3 text-muted">
          Your private course access link has been sent to your email
          {state.email ? ` (${state.email})` : ""}.
        </p>
        <Alert tone="info" className="mt-6 text-left">
          The link expires in 10 minutes. You can request a new one anytime from
          the login page.
        </Alert>
        <Link
          href="/login"
          className={buttonVariants({ size: "lg" }) + " mt-7 w-full"}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  // failed / error
  return (
    <div className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7e6e1] text-error">
        <CircleAlert size={34} />
      </span>
      <h1 className="mt-5 font-editorial text-2xl font-semibold tracking-tight sm:text-3xl">
        {state.kind === "failed" ? "Payment not completed" : "Couldn't verify yet"}
      </h1>
      <p className="mt-3 text-muted">{state.message}</p>
      <div className="mt-7 flex flex-col gap-3">
        <Link href="/checkout" className={buttonVariants({ size: "lg" })}>
          Try again
        </Link>
        <Link
          href="/login"
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
