"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function UpgradeButton({
  label = "Upgrade",
  plan,
  variant,
  className,
}: {
  label?: string;
  plan?: string;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan ? { plan } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment.");
      window.location.href = data.authorization_url;
    } catch (e: any) {
      setLoading(false);
      setError(e.message);
    }
  }

  return (
    <div>
      <Button onClick={start} disabled={loading} variant={variant} className={className}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {label}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
