import { CloudOff } from "lucide-react";

/** Shown when a published site's trial has expired / it is offline. */
export function OfflineSite({ businessName }: { businessName?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center text-ink">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/5">
        <CloudOff className="h-8 w-8 text-ink/60" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">This site is currently offline</h1>
      <p className="mt-2 max-w-sm text-ink/60">
        {businessName ? `${businessName}'s` : "This"} website is not available
        right now. If you are the owner, upgrade your plan to bring it back online.
      </p>
      <a
        href={`https://${process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com"}/dashboard`}
        className="mt-6 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-cream"
      >
        Upgrade to go live
      </a>
      <p className="mt-10 text-xs text-ink/40">Powered by Tomora</p>
    </div>
  );
}
