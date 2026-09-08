import Link from "next/link";
import { ArrowLeft, LifeBuoy, MailWarning } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Support | Admin | Tomora",
};
export const dynamic = "force-dynamic";

type HelpRequest = {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  emailed: boolean;
  created_at: string;
};

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminSupportPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("help_requests")
    .select("id, email, subject, message, status, emailed, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data as HelpRequest[]) || [];
  // The table arrives in migration 0046. Until it is applied, say so plainly
  // rather than rendering an empty page that looks like "no one has written in".
  const missingTable = Boolean(error);
  const unsent = rows.filter((r) => !r.emailed).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <LifeBuoy className="h-6 w-6" /> Support requests
        </h1>
        <p className="mt-1 text-ink/60">
          Messages sent from Help &amp; Support in the dashboard. Recorded here whether
          or not the notification email got through.
        </p>
      </div>

      {missingTable ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">The help_requests table does not exist yet.</p>
          <p className="mt-1">
            Run <code>supabase/migrations/0046_help_requests.sql</code> in the Supabase
            SQL editor, then reload this page.
          </p>
        </div>
      ) : (
        <>
          {unsent > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>{unsent}</strong>{" "}
                {unsent === 1 ? "request was" : "requests were"} recorded but the
                notification email did not send. The messages are safe, but check the
                email configuration.
              </span>
            </div>
          )}

          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-ink/50">
              No one has written in yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink">{r.subject}</p>
                    <p className="text-xs text-ink/50">{when(r.created_at)}</p>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    <a href={`mailto:${r.email}?subject=Re: ${encodeURIComponent(r.subject)}`} className="underline">
                      {r.email}
                    </a>
                    {!r.emailed && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        not emailed
                      </span>
                    )}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-ink/80">{r.message}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
