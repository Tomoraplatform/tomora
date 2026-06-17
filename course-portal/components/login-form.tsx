"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { UNAPPROVED_MESSAGE } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const errorParam = params.get("error");
  const expired = errorParam === "link_expired";
  const notApproved = errorParam === "not_approved";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [softError, setSoftError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSoftError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push(`/magic-link-sent?email=${encodeURIComponent(email)}`);
        return;
      }
      setSoftError(data.message || "We couldn't send your link. Please try again.");
    } catch {
      setSoftError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {expired && (
        <Alert tone="warning" title="That link expired">
          Magic links last 10 minutes. Enter your email to get a fresh one.
        </Alert>
      )}
      {notApproved && <Alert tone="info">{UNAPPROVED_MESSAGE}</Alert>}
      {softError && <Alert tone="error">{softError}</Alert>}

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
        <p className="mt-1.5 text-xs text-muted">Use the email you paid with.</p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Sending…
          </>
        ) : (
          "Send My Magic Link"
        )}
      </Button>
    </form>
  );
}
