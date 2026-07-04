/**
 * Instant skeleton shown while a dashboard page loads. Makes mobile bottom-nav
 * taps feel immediate instead of freezing on the previous screen.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-44 rounded-md bg-ink/10" />
        <div className="h-4 w-72 rounded-md bg-ink/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-ink/5 bg-white p-5">
            <div className="h-3 w-20 rounded bg-ink/5" />
            <div className="mt-3 h-6 w-24 rounded bg-ink/10" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-xl border border-ink/5 bg-white p-5">
        <div className="h-4 w-32 rounded bg-ink/10" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-ink/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
