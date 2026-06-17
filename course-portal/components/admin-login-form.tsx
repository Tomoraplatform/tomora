"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2, MailCheck } from "lucide-react";

export function AdminLoginForm() {
  const params = useSearchParams();
  const expired = params.get("error") === "link_expired";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
        return;
      }
      setError(data.message || "Admin access denied.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
          <MailCheck size={28} />
        </span>
        <h2 className="mt-4 text-lg font-bold tracking-tight">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-muted">
          We've sent a secure admin sign-in link to {email}. It expires in 10
          minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {expired && (
        <Alert tone="warning" title="That link didn't work">
          Magic links expire after 10 minutes and can only be used once. Enter
          your admin email to get a fresh one.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="email">Admin email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@yourdomain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Sending…
          </>
        ) : (
          "Send admin sign-in link"
        )}
      </Button>
    </form>
  );
}
