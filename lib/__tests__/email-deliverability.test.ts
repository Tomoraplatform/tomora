import { describe, expect, it, vi, beforeEach } from "vitest";
import { htmlToText } from "../html";

/**
 * The parts of an email that decide whether it is read or filed as spam.
 *
 * A donation notification landed in the owner's spam folder. Reputation is the
 * larger half of that and only sending well earns it, but two things are ours
 * to get right: mail sent as HTML alone looks machine-made to a filter, and a
 * message nobody can reply to reads like one too.
 */

const posted: any[] = [];

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.resetModules();
  posted.length = 0;
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "Tomora <support@tomora.com.ng>";
  vi.stubGlobal("fetch", async (_url: string, init: any) => {
    posted.push(JSON.parse(init.body));
    return { ok: true } as Response;
  });
});

const load = async () => await import("../email");

describe("every send carries both parts", () => {
  it("includes a plain-text alternative derived from the HTML", async () => {
    const { sendEmail } = await load();
    await sendEmail({
      to: "owner@example.com",
      subject: "New donation",
      html: "<h2>You've received a new donation</h2><p><strong>Amount: NGN 25,000</strong></p>",
    });

    const body = posted[0];
    expect(body.text, "HTML-only mail is a spam signal").toBeTruthy();
    expect(body.text).toContain("You've received a new donation");
    expect(body.text).not.toContain("<h2>");
  });

  it("gives the reader somewhere to reply", async () => {
    const { sendEmail } = await load();
    await sendEmail({ to: "a@b.com", subject: "x", html: "<p>hi</p>" });
    expect(posted[0].reply_to).toBe("support@tomora.com.ng");
  });

  it("lets a caller override both", async () => {
    const { sendEmail } = await load();
    await sendEmail({
      to: "a@b.com", subject: "x", html: "<p>hi</p>",
      text: "hand written", replyTo: "someone@else.com",
    });
    expect(posted[0].text).toBe("hand written");
    expect(posted[0].reply_to).toBe("someone@else.com");
  });
});

describe("the plain-text version stays readable", () => {
  it("keeps link targets, which are lost if only the label survives", () => {
    const out = htmlToText('<p>See <a href="https://tomora.com.ng/x">your dashboard</a></p>');
    expect(out).toContain("your dashboard");
    expect(out).toContain("https://tomora.com.ng/x");
  });

  it("turns list items into lines rather than running them together", () => {
    const out = htmlToText("<ul><li>Totes</li><li>Satchels</li></ul>");
    expect(out).toContain("- Totes");
    expect(out).toContain("- Satchels");
  });

  it("decodes the entities the templates actually use", () => {
    expect(htmlToText("<p>&#8358;48,500 &mdash; paid</p>")).toContain("NGN 48,500");
    expect(htmlToText("<p>Tom &amp; Co</p>")).toContain("Tom & Co");
  });

  it("drops style and script rather than printing their contents", () => {
    const out = htmlToText("<style>p{color:red}</style><script>alert(1)</script><p>Hello</p>");
    expect(out).toBe("Hello");
  });
});
