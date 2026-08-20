import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { isTomoraHost } from "../tiktok/config";

/**
 * The two things about this integration that are easy to get quietly wrong:
 * where the pixel is allowed to run, and what leaves the server about a person.
 */

describe("where the pixel may load", () => {
  it("runs on Tomora's own site", () => {
    expect(isTomoraHost("tomora.com.ng")).toBe(true);
    expect(isTomoraHost("www.tomora.com.ng")).toBe(true);
    expect(isTomoraHost("tomora.vercel.app")).toBe(true);
    expect(isTomoraHost("localhost:3000")).toBe(true);
  });

  it("never runs on a seller's shop", () => {
    // These are a customer's shoppers. Tomora's pixel has no business there.
    expect(isTomoraHost("oto-men-5054.tomora.com.ng")).toBe(false);
    expect(isTomoraHost("tomora-demo-4580.tomora.com.ng")).toBe(false);
    expect(isTomoraHost("donnywear.com")).toBe(false);
    expect(isTomoraHost("www.someshop.ng")).toBe(false);
  });

  it("is not fooled by a lookalike domain", () => {
    expect(isTomoraHost("tomora.com.ng.evil.com")).toBe(false);
    expect(isTomoraHost("nottomora.com.ng")).toBe(false);
  });
});

/** Mirrors the hashing in lib/tiktok/events-api, which is server-only. */
const sha = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
const hash = (value?: string | null) => {
  const v = (value || "").trim().toLowerCase();
  return v ? sha(v) : undefined;
};
const hashPhone = (raw?: string | null) => {
  const digits = (raw || "").replace(/[^\d+]/g, "");
  if (!digits) return undefined;
  let e164 = digits;
  if (e164.startsWith("0")) e164 = `+234${e164.slice(1)}`;
  else if (!e164.startsWith("+")) e164 = `+${e164}`;
  return hash(e164);
};

describe("what leaves the server about a person", () => {
  it("hashes an email, never sends it in the clear", () => {
    const out = hash("  Ada@Example.COM ");
    expect(out).toBe(sha("ada@example.com"));
    expect(out).not.toContain("ada");
    expect(out).toHaveLength(64);
  });

  it("normalises a Nigerian phone to E.164 before hashing", () => {
    // 08031234567 and +2348031234567 are the same person, and must hash alike
    // or the match rate quietly collapses.
    expect(hashPhone("0803 123 4567")).toBe(hashPhone("+234 803 123 4567"));
    expect(hashPhone("08031234567")).toBe(sha("+2348031234567"));
  });

  it("sends nothing at all when there is nothing to send", () => {
    expect(hash("")).toBeUndefined();
    expect(hash(null)).toBeUndefined();
    expect(hashPhone("")).toBeUndefined();
  });
});
