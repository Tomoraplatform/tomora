import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { buttons, clamp, list, text } from "../live/messages";
import { storeCodeFrom, storeLink } from "../live/config";

vi.mock("server-only", () => ({}));

/**
 * The webhook door and the message shapes.
 *
 * Signature verification is the only thing standing between this endpoint and
 * anyone who finds the URL, so its failure modes are worth stating outright.
 * The clamps matter for a duller reason: WhatsApp rejects an entire message
 * when one title is a character too long, and product names come from sellers.
 */

const SECRET = "test-app-secret";
const load = async () => await import("../live/provider");

function sign(body: string, secret = SECRET): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

beforeEach(() => {
  vi.resetModules();
  process.env.WHATSAPP_APP_SECRET = SECRET;
  process.env.WHATSAPP_VERIFY_TOKEN = "verify-me";
});

afterEach(() => {
  delete process.env.WHATSAPP_APP_SECRET;
  delete process.env.WHATSAPP_VERIFY_TOKEN;
});

describe("verifySignature", () => {
  it("accepts a body signed with the app secret", async () => {
    const { verifySignature } = await load();
    const body = JSON.stringify({ hello: "world" });
    expect(verifySignature(body, sign(body))).toBe(true);
  });

  it("rejects a body that was changed after signing", async () => {
    const { verifySignature } = await load();
    const signature = sign(JSON.stringify({ amount: 100 }));
    expect(verifySignature(JSON.stringify({ amount: 999999 }), signature)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", async () => {
    const { verifySignature } = await load();
    const body = "{}";
    expect(verifySignature(body, sign(body, "not-the-secret"))).toBe(false);
  });

  it("rejects a missing signature header", async () => {
    const { verifySignature } = await load();
    expect(verifySignature("{}", null)).toBe(false);
  });

  it("rejects everything when no app secret is configured", async () => {
    delete process.env.WHATSAPP_APP_SECRET;
    vi.resetModules();
    const { verifySignature } = await load();
    const body = "{}";
    // Fails closed: an unconfigured secret must never mean "let everyone in".
    expect(verifySignature(body, sign(body))).toBe(false);
  });

  it("rejects a malformed header without throwing", async () => {
    const { verifySignature } = await load();
    expect(verifySignature("{}", "garbage")).toBe(false);
    expect(verifySignature("{}", "sha256=")).toBe(false);
  });
});

describe("verifyChallenge", () => {
  it("echoes the challenge when the verify token matches", async () => {
    const { verifyChallenge } = await load();
    const params = new URLSearchParams({
      "hub.mode": "subscribe", "hub.verify_token": "verify-me", "hub.challenge": "12345",
    });
    expect(verifyChallenge(params)).toBe("12345");
  });

  it("refuses a wrong verify token", async () => {
    const { verifyChallenge } = await load();
    const params = new URLSearchParams({
      "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "12345",
    });
    expect(verifyChallenge(params)).toBeNull();
  });

  it("refuses when the mode is not subscribe", async () => {
    const { verifyChallenge } = await load();
    const params = new URLSearchParams({
      "hub.mode": "unsubscribe", "hub.verify_token": "verify-me", "hub.challenge": "1",
    });
    expect(verifyChallenge(params)).toBeNull();
  });
});

describe("message builders", () => {
  it("leaves short text alone", () => {
    expect(clamp("Ankara Shirt", 24)).toBe("Ankara Shirt");
  });

  it("cuts a long title and marks it", () => {
    const out = clamp("A very long product name that will never fit in a WhatsApp row", 24);
    expect(out.length).toBeLessThanOrEqual(24);
    expect(out.endsWith("…")).toBe(true);
  });

  it("keeps list rows within WhatsApp's ten", () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ id: `p:${i}`, title: `Item ${i}` }));
    const message = list("Body", "See items", rows) as any;
    expect(message.interactive.action.sections[0].rows).toHaveLength(10);
  });

  it("clamps a seller's long product name inside a row", () => {
    const message = list("Body", "Go", [
      { id: "p:1", title: "Hand woven Aso Oke gele in royal blue with gold trim" },
    ]) as any;
    expect(message.interactive.action.sections[0].rows[0].title.length).toBeLessThanOrEqual(24);
  });

  it("keeps buttons within WhatsApp's three", () => {
    const message = buttons("Pick", [
      { id: "a", title: "A" }, { id: "b", title: "B" },
      { id: "c", title: "C" }, { id: "d", title: "D" },
    ]) as any;
    expect(message.interactive.action.buttons).toHaveLength(3);
  });

  it("builds plain text", () => {
    const message = text("Hello") as any;
    expect(message.type).toBe("text");
    expect(message.text.body).toBe("Hello");
  });
});

describe("store codes and links", () => {
  it("makes a typeable code from a subdomain", () => {
    // Punctuation dropped, cut to 12, and O/I become 0/1.
    expect(storeCodeFrom("adebayo-fashion")).toBe("ADEBAY0FASH1");
  });

  it("replaces characters that are misread when copied by hand", () => {
    // O/I/L become 0/1/1 so a code read aloud still resolves.
    expect(storeCodeFrom("polo")).toBe("P010");
  });

  it("never exceeds twelve characters", () => {
    expect(storeCodeFrom("averylongbusinessnamehere").length).toBe(12);
  });

  it("never returns an empty code", () => {
    expect(storeCodeFrom("---")).toBe("STORE");
    expect(storeCodeFrom("")).toBe("STORE");
  });

  it("builds a wa.me link carrying the shop command", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "2348012345678";
    expect(storeLink("ADEBAYO")).toBe("https://wa.me/2348012345678?text=SHOP%20ADEBAYO");
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  });
});
