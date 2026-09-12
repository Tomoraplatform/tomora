import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * What Tomora knows about a message after handing it over.
 *
 * "Sent" used to mean the mail service answered 200, and nothing more: a batch
 * could be accepted in full and arrive nowhere, with no way to tell. These
 * keep the provider's id, and the headers bulk mail is judged on.
 */

vi.mock("server-only", () => ({}));
vi.mock("@/lib/support", () => ({ SUPPORT_EMAIL: "support@tomora.com.ng" }));

const calls: { url: string; body: any; method?: string }[] = [];
let reply: { ok: boolean; status?: number; json?: unknown; text?: string } = { ok: true, json: { id: "msg_1" } };

beforeEach(() => {
  vi.resetModules();
  calls.length = 0;
  process.env.RESEND_API_KEY = "re_test";
  process.env.EMAIL_FROM = "Tomora <support@tomora.com.ng>";
  vi.stubGlobal("fetch", async (url: string, init?: { body?: string; method?: string }) => ({
    ok: reply.ok,
    status: reply.status ?? (reply.ok ? 200 : 422),
    statusText: reply.ok ? "OK" : "Unprocessable",
    json: async () => reply.json ?? {},
    text: async () => reply.text ?? "",
  } as Response));
  // Record what was sent, which the stub above cannot do on its own.
  const realFetch = globalThis.fetch as any;
  vi.stubGlobal("fetch", async (url: string, init?: { body?: string; method?: string }) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined, method: init?.method });
    return realFetch(url, init);
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("sendEmailDetailed", () => {
  it("keeps the message id, so the send can be traced later", async () => {
    const { sendEmailDetailed } = await import("../email");
    const res = await sendEmailDetailed({ to: "a@b.co", subject: "Hi", html: "<p>Hi</p>" });
    expect(res).toEqual({ ok: true, id: "msg_1" });
  });

  it("passes bulk headers through when given, and sends none otherwise", async () => {
    const { sendEmailDetailed } = await import("../email");
    await sendEmailDetailed({
      to: "a@b.co", subject: "Hi", html: "<p>Hi</p>",
      headers: { "List-Unsubscribe": "<https://x/unsubscribe?t=1>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    expect(calls[0].body.headers["List-Unsubscribe"]).toBe("<https://x/unsubscribe?t=1>");
    expect(calls[0].body.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");

    await sendEmailDetailed({ to: "a@b.co", subject: "Receipt", html: "<p>Thanks</p>" });
    expect("headers" in calls[1].body).toBe(false);
  });

  it("reports why a send was refused instead of a bare false", async () => {
    reply = { ok: false, status: 422, text: "invalid from address" };
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmailDetailed, sendEmail } = await import("../email");
    const res = await sendEmailDetailed({ to: "a@b.co", subject: "Hi", html: "<p>Hi</p>" });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/422/);
    // The old boolean caller still behaves exactly as before.
    expect(await sendEmail({ to: "a@b.co", subject: "Hi", html: "<p>Hi</p>" })).toBe(false);
    errors.mockRestore();
    reply = { ok: true, json: { id: "msg_1" } };
  });
});

describe("emailDeliveryStatus", () => {
  it("reports what became of a message", async () => {
    reply = { ok: true, json: { last_event: "delivered" } };
    const { emailDeliveryStatus } = await import("../email");
    expect(await emailDeliveryStatus("msg_1")).toBe("delivered");
    reply = { ok: true, json: { id: "msg_1" } };
  });

  it("says nothing rather than guessing when it cannot ask", async () => {
    const { emailDeliveryStatus } = await import("../email");
    expect(await emailDeliveryStatus("")).toBeNull();

    reply = { ok: false, status: 404 };
    expect(await emailDeliveryStatus("gone")).toBeNull();
    reply = { ok: true, json: { id: "msg_1" } };
  });
});
