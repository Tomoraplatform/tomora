"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
function AppleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.6c-.02-2.05 1.67-3.03 1.75-3.08-0.95-1.4-2.44-1.59-2.97-1.61-1.27-.13-2.47.74-3.11.74-.64 0-1.63-.72-2.68-.7-1.38.02-2.65.8-3.36 2.03-1.43 2.49-.37 6.17 1.03 8.19.68.99 1.5 2.1 2.57 2.06 1.03-.04 1.42-.66 2.67-.66 1.24 0 1.6.66 2.68.64 1.11-.02 1.81-1 2.49-2 .78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.15-.83-2.18-3.28Zm-2.05-6.03c.56-.69.94-1.63.83-2.57-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.57-.86 2.48.9.07 1.83-.46 2.4-1.13Z" />
    </svg>
  );
}

/** Google / Apple sign-in buttons (Supabase OAuth). */
export function SocialAuth({ next = "/dashboard" }: { next?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(provider: "google" | "apple") {
    setBusy(provider);
    setError(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) { setError(error.message); setBusy(null); }
      // On success the browser is redirected to the provider.
    } catch (e: any) {
      setError(e?.message || "Could not start sign-in. Please try again.");
      setBusy(null);
    }
  }

  const btn = "flex w-full items-center justify-center gap-2.5 rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink/[0.03] disabled:opacity-60";

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}
      <button type="button" onClick={() => go("google")} disabled={!!busy} className={btn}>
        {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />} Continue with Google
      </button>
      <button type="button" onClick={() => go("apple")} disabled={!!busy} className={btn}>
        {busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon />} Continue with Apple
      </button>
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-ink/10" />
        <span className="text-xs text-ink/40">or</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>
    </div>
  );
}
