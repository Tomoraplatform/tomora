import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPPORT_EMAIL } from "@/lib/support";

export const dynamic = "force-dynamic";

/**
 * One click, no login, no confirmation step: the point of an unsubscribe link
 * is that it works. The token is a random uuid on the profile, so the link
 * identifies the account without exposing who it belongs to, and it only ever
 * switches marketing email off. Order, donation and account email are
 * unaffected, because that is mail people asked for.
 */
export async function GET(request: NextRequest) {
  return handle(request);
}

/**
 * One-click unsubscribe (RFC 8058). Gmail and Yahoo post here themselves when
 * someone presses the unsubscribe button in the mail client, and they judge
 * bulk senders on offering it. No page is shown: the mail client reports it.
 */
export async function POST(request: NextRequest) {
  const res = await handle(request);
  return new Response(null, { status: res.status === 200 ? 200 : 400 });
}

async function handle(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("t") || "";
  let done = false;

  if (/^[0-9a-f-]{36}$/i.test(token)) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .update({ marketing_opt_out: true })
        .eq("unsubscribe_token", token)
        .select("user_id");
      done = !!data?.length;
    } catch { /* falls through to the "couldn't do it" message */ }
  }

  return new Response(page(done), {
    status: done ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function page(done: boolean): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${done ? "Unsubscribed" : "Link not recognised"} | Tomora</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#fdfaf4;color:#022245;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px}
  .card{max-width:34rem;text-align:center}
  h1{font-size:1.5rem;margin:0 0 .5rem}
  p{color:#4b5563;margin:.5rem 0}
  a{color:#022245}
</style></head>
<body><div class="card">
  <h1>${done ? "You're unsubscribed" : "We couldn't do that"}</h1>
  <p>${done
    ? "You won't get any more tips or offers from Tomora. Emails about your orders, donations and account still come through, because those are part of the service."
    : "That link is not one we recognise. It may have already been used, or been cut short by your email app."}</p>
  <p>Changed your mind, or need a hand? Write to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
</div></body></html>`;
}
