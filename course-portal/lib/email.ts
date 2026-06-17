/**
 * Email layer. Supports Resend (default) and SendGrid via EMAIL_PROVIDER.
 * Server-only — reads EMAIL_API_KEY.
 */
import { COURSE_NAME } from "@/lib/constants";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

async function sendViaResend({ to, subject, html }: SendArgs) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend error: ${t}`);
  }
}

function parseFrom() {
  const fromRaw = process.env.EMAIL_FROM || "";
  // Supports "Name <email@x.com>" or plain "email@x.com"
  const match = fromRaw.match(/^(.*)<(.+)>$/);
  return {
    email: (match ? match[2] : fromRaw).trim(),
    name: match ? match[1].trim() : COURSE_NAME,
  };
}

async function sendViaBrevo({ to, subject, html }: SendArgs) {
  const from = parseFrom();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      // Server-only key — never exposed to the browser.
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: from.email, name: from.name },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Brevo error: ${t}`);
  }
}

async function sendViaSendgrid({ to, subject, html }: SendArgs) {
  const fromRaw = process.env.EMAIL_FROM || "";
  // Supports "Name <email@x.com>" or plain "email@x.com"
  const match = fromRaw.match(/^(.*)<(.+)>$/);
  const fromEmail = (match ? match[2] : fromRaw).trim();
  const fromName = match ? match[1].trim() : COURSE_NAME;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`SendGrid error: ${t}`);
  }
}

export async function sendEmail(args: SendArgs) {
  const provider = (process.env.EMAIL_PROVIDER || "brevo").toLowerCase();
  const apiKey =
    provider === "brevo" ? process.env.BREVO_API_KEY : process.env.EMAIL_API_KEY;

  if (!apiKey) {
    // In local/dev without a key, log instead of throwing so flows still work.
    console.warn(
      `[email] ${provider} API key missing — would have sent "${args.subject}" to ${args.to}`,
    );
    return;
  }

  if (provider === "brevo") return sendViaBrevo(args);
  if (provider === "sendgrid") return sendViaSendgrid(args);
  return sendViaResend(args);
}

/* ───────────────────────────── Templates ───────────────────────────── */

const wrap = (inner: string) => `
<!doctype html>
<html>
  <body style="margin:0;background:#fff8ec;font-family:'Helvetica Neue',Arial,sans-serif;color:#1d1d1d;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8ec;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #ece2cf;border-radius:20px;overflow:hidden;">
          <tr><td style="padding:28px 32px 8px;">
            <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#c8822f;font-weight:700;">${COURSE_NAME}</div>
          </td></tr>
          <tr><td style="padding:8px 32px 32px;font-size:16px;line-height:1.6;color:#1d1d1d;">
            ${inner}
          </td></tr>
        </table>
        <div style="max-width:560px;color:#7c7468;font-size:12px;padding:16px 8px;">
          You're receiving this because you enrolled in ${COURSE_NAME}.
        </div>
      </td></tr>
    </table>
  </body>
</html>`;

const button = (href: string, label: string) => `
<a href="${href}" style="display:inline-block;background:#c8822f;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px;font-size:15px;">${label}</a>`;

export function magicLinkEmail(name: string, link: string) {
  return {
    subject: `Your Private Access Link — ${COURSE_NAME}`,
    html: wrap(`
      <h1 style="font-size:22px;margin:8px 0 16px;">Hi ${escapeHtml(name)},</h1>
      <p style="margin:0 0 16px;">Here is your private access link to <strong>${COURSE_NAME}</strong>.</p>
      <p style="margin:0 0 24px;">This link expires in <strong>10 minutes</strong>. If it expires, you can request a new one from the login page.</p>
      <p style="margin:0 0 28px;">${button(link, "Open My Course")}</p>
      <p style="margin:0;color:#7c7468;font-size:13px;">If the button doesn't work, paste this link into your browser:<br/>
      <span style="word-break:break-all;color:#a8691f;">${link}</span></p>
    `),
  };
}

export function welcomeEmail(name: string) {
  return {
    subject: `Welcome to ${COURSE_NAME}`,
    html: wrap(`
      <h1 style="font-size:22px;margin:8px 0 16px;">Hi ${escapeHtml(name)},</h1>
      <p style="margin:0 0 16px;">Your payment has been confirmed, and your access to <strong>${COURSE_NAME}</strong> is ready.</p>
      <p style="margin:0 0 16px;">We've sent your private access link to this email.</p>
      <p style="margin:0;color:#7c7468;">Use the email you paid with anytime you want to request a fresh magic link.</p>
    `),
  };
}

export function feedbackNotificationEmail(args: {
  studentName: string;
  studentEmail: string;
  moduleNumber: number;
  moduleTitle: string;
  biggestTakeaway: string;
  whereStuck: string;
  questionForExpert: string;
  submittedAt: string;
}) {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #ece2cf;vertical-align:top;width:170px;color:#7c7468;font-size:13px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #ece2cf;color:#1d1d1d;">${escapeHtml(value) || "—"}</td>
    </tr>`;
  return {
    subject: `New Course Feedback — ${args.studentName} — Module ${args.moduleNumber}`,
    html: wrap(`
      <h1 style="font-size:20px;margin:8px 0 16px;">New module feedback received</h1>
      <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">
        ${row("Student", args.studentName)}
        ${row("Email", args.studentEmail)}
        ${row("Module", `Module ${args.moduleNumber} — ${args.moduleTitle}`)}
        ${row("Biggest takeaway", args.biggestTakeaway)}
        ${row("Where they are stuck", args.whereStuck)}
        ${row("Question for the Expert", args.questionForExpert)}
        ${row("Date submitted", args.submittedAt)}
      </table>
    `),
  };
}

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
