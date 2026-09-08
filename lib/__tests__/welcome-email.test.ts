import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * The welcome email.
 *
 * Two things here are easy to get wrong and invisible when they are: greeting
 * someone by a name that turns out to be markup, and sending a second copy to a
 * person who already has an account, which would quietly tell a stranger that
 * an address is registered.
 */

const posted: { body: any; headers: Record<string, string> }[] = [];

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.resetModules();
  posted.length = 0;
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "Tomora <support@tomora.com.ng>";
  vi.stubGlobal("fetch", async (_url: string, init: any) => {
    posted.push({ body: JSON.parse(init.body), headers: init.headers });
    return { ok: true } as Response;
  });
});

const load = async () => await import("../email");

describe("what a new account is sent", () => {
  it("greets them by first name and points at the first screen", async () => {
    const { sendWelcomeEmail } = await load();
    const ok = await sendWelcomeEmail({ to: "ada@example.com", name: "Ada Obi" });

    expect(ok).toBe(true);
    expect(posted).toHaveLength(1);
    const mail = posted[0].body;
    expect(mail.to).toBe("ada@example.com");
    expect(mail.subject).toContain("Welcome");
    expect(mail.html).toContain("Welcome, Ada!");
    expect(mail.html).toContain("/onboarding");
  });

  it("still reads properly when no name was given", async () => {
    const { sendWelcomeEmail } = await load();
    await sendWelcomeEmail({ to: "someone@example.com", name: null });
    expect(posted[0].body.html).toContain("Welcome, there!");
  });

  it("points people at support, not a personal inbox", async () => {
    const { sendWelcomeEmail } = await load();
    await sendWelcomeEmail({ to: "ada@example.com", name: "Ada" });
    expect(posted[0].body.html).toContain("support@tomora.com.ng");
    expect(posted[0].body.html).not.toContain("gmail.com");
  });

  it("escapes a name so it cannot inject markup", async () => {
    const { sendWelcomeEmail } = await load();
    await sendWelcomeEmail({ to: "x@example.com", name: '<img src=x onerror="alert(1)">' });

    const html = posted[0].body.html;
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});

describe("when email is not configured", () => {
  it("says so rather than throwing, so a signup still completes", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendWelcomeEmail } = await load();
    const ok = await sendWelcomeEmail({ to: "ada@example.com", name: "Ada" });

    expect(ok).toBe(false);
    expect(posted, "nothing should have been sent").toHaveLength(0);
  });

  it("reports failure rather than throwing when Resend rejects", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: false }) as Response);
    const { sendWelcomeEmail } = await load();
    const ok = await sendWelcomeEmail({ to: "ada@example.com", name: "Ada" });
    expect(ok).toBe(false);
  });
});
