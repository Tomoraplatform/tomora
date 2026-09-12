"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailDetailed, emailDeliveryStatus } from "@/lib/email";
import { escapeHtml } from "@/lib/html";
import { SUPPORT_EMAIL } from "@/lib/support";
import { APP_DOMAIN } from "@/lib/constants";
// MAX_PER_SEND lives in lib/outreach: every export of a "use server" module
// must be an async function, and the screen needs the same number.
import { MAX_PER_SEND, greetingName, renderTemplate } from "@/lib/outreach";
import { siteLiveUrl } from "@/lib/site-url";

/**
 * One send at a time, with a gap between them: Resend rejects a burst, and a
 * young sending domain that suddenly fires off a hundred messages at once is
 * exactly what a spam filter is watching for.
 */
const GAP_MS = 400;

export interface OutreachResult {
  ok: boolean;
  sent: number;
  failed: number;
  skipped: number;
  /** Up to a handful of addresses that did not go, with the reason. */
  problems: string[];
  error?: string;
}

/**
 * Emails the selected users from Tomora's support address.
 *
 * Every message is written to `outreach_messages` whether or not it sent, so
 * the next person to open this page can see who has already been contacted.
 * Anyone who opted out is skipped here as well as in the list, because the
 * list is a snapshot and this is the moment that matters.
 */
export async function sendOutreach(input: {
  userIds: string[];
  subject: string;
  body: string;
  bookingLink?: string;
}): Promise<OutreachResult> {
  const blank: OutreachResult = { ok: false, sent: 0, failed: 0, skipped: 0, problems: [] };
  try {
    if (!(await isAdmin())) return { ...blank, error: "Forbidden" };

    const subject = (input.subject || "").trim();
    const body = (input.body || "").trim();
    const ids = Array.from(new Set((input.userIds || []).filter(Boolean)));
    if (!subject || !body) return { ...blank, error: "Add a subject and a message." };
    if (!ids.length) return { ...blank, error: "Select at least one person." };
    if (ids.length > MAX_PER_SEND) {
      return { ...blank, error: `Select up to ${MAX_PER_SEND} people at a time, so the mail is not sent as a burst.` };
    }

    const admin = createAdminClient();
    const supabase = createClient();
    const { data: { user: me } } = await supabase.auth.getUser();

    const [{ data: profiles }, { data: sites }] = await Promise.all([
      admin.from("profiles").select("user_id, email, business_name, marketing_opt_out, unsubscribe_token").in("user_id", ids),
      admin.from("sites").select("user_id, subdomain, custom_domain, domain_status, created_at").in("user_id", ids),
    ]);

    // The first site is the one an owner thinks of as theirs.
    const siteByUser = new Map<string, any>();
    for (const s of (sites as any[]) || []) if (!siteByUser.has(s.user_id)) siteByUser.set(s.user_id, s);

    const result: OutreachResult = { ok: true, sent: 0, failed: 0, skipped: 0, problems: [] };
    const rows: Record<string, unknown>[] = [];
    const booking = (input.bookingLink || "").trim();

    for (const p of (profiles as any[]) || []) {
      const email = (p.email || "").trim();
      if (!email || p.marketing_opt_out) {
        result.skipped += 1;
        if (email) rows.push({ user_id: p.user_id, email, subject, body, status: "skipped", error: "opted out", sent_by: me?.id || null });
        continue;
      }

      const site = siteByUser.get(p.user_id);
      const host = site ? siteLiveUrl(site).replace(/^https?:\/\//, "") : `your-name.${APP_DOMAIN}`;
      const text = renderTemplate(body, {
        name: greetingName(p.business_name, email),
        site: host,
        dashboard: `https://www.${APP_DOMAIN}/dashboard`,
        booking: booking || `mailto:${SUPPORT_EMAIL}`,
      });

      const stopLink = unsubscribeUrl(p.unsubscribe_token);
      const res = await sendEmailDetailed({
        to: email,
        subject,
        html: emailHtml(text, p.unsubscribe_token),
        text: `${text}\n\n---\nYou are receiving this because you have a Tomora account.${stopLink ? ` To stop these emails: ${stopLink}` : " To stop these emails, reply with STOP."}`,
        replyTo: SUPPORT_EMAIL,
        // Bulk mail is judged by a stricter standard than a receipt is. Gmail
        // and Yahoo expect a machine-readable way out of a mailing list, and
        // quietly bin bulk mail that offers only a link in the body. The POST
        // header is one-click unsubscribe (RFC 8058), which /unsubscribe
        // answers.
        headers: stopLink ? {
          "List-Unsubscribe": `<${stopLink}>, <mailto:${SUPPORT_EMAIL}?subject=Unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        } : undefined,
      });

      if (res.ok) result.sent += 1;
      else {
        result.failed += 1;
        if (result.problems.length < 5) result.problems.push(`${email}: ${res.error || "the mail service refused it"}`);
      }
      rows.push({
        user_id: p.user_id, email, subject, body,
        status: res.ok ? "sent" : "failed",
        error: res.ok ? null : (res.error || "send failed"),
        message_id: res.id || null,
        sent_by: me?.id || null,
      });

      await new Promise((r) => setTimeout(r, GAP_MS));
    }

    if (rows.length) {
      let { error } = await admin.from("outreach_messages").insert(rows);
      // message_id arrives in migration 0049; without it the history is still
      // worth keeping, just not traceable.
      if (error) {
        ({ error } = await admin.from("outreach_messages").insert(
          rows.map(({ message_id: _drop, ...rest }) => rest)
        ));
      }
      // The mail has gone either way; say so rather than pretending it failed.
      if (error) result.problems.push(`Sent, but the history could not be saved: ${error.message}`);
    }

    revalidatePath("/admin/outreach");
    return result;
  } catch (e: any) {
    return { ...blank, error: e?.message || "Could not send." };
  }
}

/** The one-click way out, which is also what the List-Unsubscribe header points at. */
function unsubscribeUrl(token?: string | null): string | null {
  return token ? `https://www.${APP_DOMAIN}/unsubscribe?t=${encodeURIComponent(token)}` : null;
}

/**
 * Asks the mail service what became of recent sends and records it.
 *
 * Tomora only ever knew that a message was accepted. This is the difference
 * between "we sent it" and "it arrived", which is the whole question when a
 * batch goes out and nobody replies.
 */
export async function refreshOutreachDelivery(): Promise<{ ok: boolean; checked: number; error?: string }> {
  try {
    if (!(await isAdmin())) return { ok: false, checked: 0, error: "Forbidden" };
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("outreach_messages")
      .select("id, message_id, delivery")
      .not("message_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return { ok: false, checked: 0, error: "Run migration 0049 first." };

    let checked = 0;
    for (const row of (data as { id: string; message_id: string; delivery: string | null }[]) || []) {
      // A delivered message cannot become undelivered; a bounce is final too.
      if (row.delivery === "delivered" || row.delivery === "bounced" || row.delivery === "complained") continue;
      const status = await emailDeliveryStatus(row.message_id);
      if (!status) continue;
      await admin.from("outreach_messages")
        .update({ delivery: status, delivery_checked_at: new Date().toISOString() })
        .eq("id", row.id);
      checked += 1;
    }
    revalidatePath("/admin/outreach");
    return { ok: true, checked };
  } catch (e: any) {
    return { ok: false, checked: 0, error: e?.message || "Could not check." };
  }
}

/** Plain paragraphs, a real reply-to, and a way out. Nothing else. */
function emailHtml(text: string, unsubscribeToken?: string | null): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const link = unsubscribeToken
    ? `https://www.${APP_DOMAIN}/unsubscribe?t=${encodeURIComponent(unsubscribeToken)}`
    : null;
  return `${paragraphs}
    <p style="color:#667;font-size:12px">
      You are receiving this because you have a Tomora account.
      ${link ? `<a href="${link}">Stop receiving these emails</a>.` : "Reply with STOP to opt out."}
    </p>`;
}
