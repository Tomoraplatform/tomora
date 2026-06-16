import { Search } from "lucide-react";

export default function SiteNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center text-ink">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/5">
        <Search className="h-8 w-8 text-ink/60" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Site not found</h1>
      <p className="mt-2 max-w-sm text-ink/60">
        There is no Tomora site at this address. It may have been moved or never existed.
      </p>
      <a href={`https://${process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com"}`} className="mt-6 rounded-md bg-ink px-6 py-3 text-sm font-semibold text-cream">
        Go to Tomora
      </a>
    </div>
  );
}
