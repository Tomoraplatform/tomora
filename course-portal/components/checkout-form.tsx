"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2, Lock } from "lucide-react";

export function CheckoutForm({ priceLabel }: { priceLabel: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        setError(data.error || "We couldn't start the payment. Please try again.");
        setLoading(false);
        return;
      }
      // Redirect to Paystack hosted checkout.
      window.location.href = data.authorization_url;
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}

      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          required
          autoComplete="name"
          placeholder="Ada Obi"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <p className="mt-1.5 text-xs text-muted">
          You'll use this email to access the course. Choose it carefully.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Redirecting to payment…
          </>
        ) : (
          <>Enroll Now — {priceLabel}</>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <Lock size={13} /> Secure payment powered by Paystack
      </p>
    </form>
  );
}
