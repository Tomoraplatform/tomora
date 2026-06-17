"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function ResendLink() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  async function resend() {
    if (!email) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ tone: "success", text: "A fresh link is on its way." });
      } else {
        setMsg({ tone: "error", text: data.message || "Couldn't resend. Try the login page." });
      }
    } catch {
      setMsg({ tone: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {email && (
        <p className="text-sm text-muted">
          Sent to <span className="font-semibold text-charcoal">{email}</span>
        </p>
      )}
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={resend}
        disabled={loading || !email}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Sending…
          </>
        ) : (
          "Request a new link"
        )}
      </Button>
    </div>
  );
}
