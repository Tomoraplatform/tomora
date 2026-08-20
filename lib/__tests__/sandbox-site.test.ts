import { describe, expect, it } from "vitest";

/**
 * The rule that makes test mode a separate dashboard rather than a filter over
 * the real one: in test mode the dashboard works on demo stores, in real mode
 * it never shows them. Both directions matter, since a demo store appearing in
 * the real site switcher would be just as confusing as the reverse.
 */
type S = { id: string; is_demo?: boolean };
const visible = (sites: S[], testing: boolean) => sites.filter((s) => !!s.is_demo === testing);

const SITES: S[] = [
  { id: "real-1" },
  { id: "real-2", is_demo: false },
  { id: "demo-1", is_demo: true },
  { id: "demo-2", is_demo: true },
];

describe("which store the dashboard works on", () => {
  it("shows only demo stores in test mode", () => {
    expect(visible(SITES, true).map((s) => s.id)).toEqual(["demo-1", "demo-2"]);
  });

  it("hides demo stores in real mode", () => {
    expect(visible(SITES, false).map((s) => s.id)).toEqual(["real-1", "real-2"]);
  });

  it("keeps the two selections on separate cookies", async () => {
    // Read as source: lib/dashboard pulls in React's server cache, which will
    // not load outside a request. Sharing one cookie would mean switching modes
    // silently changed which real site the owner was editing.
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const body = readFileSync(join(__dirname, "..", "dashboard.ts"), "utf8");
    const real = body.match(/SITE_COOKIE = "([^"]+)"/)?.[1];
    const demo = body.match(/DEMO_SITE_COOKIE = "([^"]+)"/)?.[1];
    expect(real).toBeTruthy();
    expect(demo).toBeTruthy();
    expect(real).not.toBe(demo);
  });
});
