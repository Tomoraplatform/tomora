import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * The sender address.
 *
 * EMAIL_FROM is typed by hand into a dashboard and has silenced every email the
 * product sends twice: once as a misspelt domain, once as an unclosed angle
 * bracket. Resend answers a malformed sender with a 422, so the symptom is mail
 * that simply never arrives. These pin the repairs, and pin that a repair is
 * always reported rather than done quietly.
 */

vi.mock("server-only", () => ({}));

const load = async () => await import("../email");

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  delete process.env.EMAIL_FROM;
});

describe("addresses that are already valid pass through untouched", () => {
  it("a bare address", async () => {
    process.env.EMAIL_FROM = "support@tomora.com.ng";
    const { senderAddress } = await load();
    expect(senderAddress()).toBe("support@tomora.com.ng");
  });

  it("a named address", async () => {
    process.env.EMAIL_FROM = "Tomora <support@tomora.com.ng>";
    const { senderAddress } = await load();
    expect(senderAddress()).toBe("Tomora <support@tomora.com.ng>");
  });
});

describe("the mistake that actually happened", () => {
  it("closes an unclosed angle bracket", async () => {
    // This exact value returned 422 from Resend in production.
    process.env.EMAIL_FROM = "Tomora <support@tomora.com.ng";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { senderAddress } = await load();

    expect(senderAddress()).toBe("Tomora <support@tomora.com.ng>");
    expect(warn, "a silent repair would hide the misconfiguration").toHaveBeenCalled();
  });

  it("recovers an address from surrounding rubbish", async () => {
    process.env.EMAIL_FROM = "Tomora support@tomora.com.ng please";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { senderAddress } = await load();
    expect(senderAddress()).toBe("support@tomora.com.ng");
  });
});

describe("when nothing usable is configured", () => {
  it("falls back rather than sending an invalid sender", async () => {
    process.env.EMAIL_FROM = "not an address";
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { senderAddress } = await load();

    expect(senderAddress()).toContain("@");
    expect(error).toHaveBeenCalled();
  });

  it("falls back when the variable is unset", async () => {
    const { senderAddress } = await load();
    expect(senderAddress()).toBe("Tomora <onboarding@resend.dev>");
  });
});
