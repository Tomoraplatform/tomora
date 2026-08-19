import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * The mode gate. A non-admin must land in real mode no matter what their
 * cookie says, because the cookie is the only thing a browser controls and
 * every dashboard read trusts the answer this gives.
 */
let cookieValue: string | undefined;
let adminAnswer = false;

vi.mock("next/headers", () => ({
  cookies: () => ({ get: (name: string) => (cookieValue === undefined ? undefined : { name, value: cookieValue }) }),
}));
vi.mock("@/lib/admin", () => ({ isAdmin: async () => adminAnswer }));
vi.mock("server-only", () => ({}));
// React's cache() memoises per request; in a test each call should be fresh.
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

const load = async () => await import("../sandbox");

describe("sandbox mode gate", () => {
  beforeEach(() => { vi.resetModules(); });

  it("is real when no cookie is set", async () => {
    cookieValue = undefined; adminAnswer = true;
    const { currentMode } = await load();
    expect(await currentMode()).toBe("real");
  });

  it("is test for an admin who asked for it", async () => {
    cookieValue = "test"; adminAnswer = true;
    const { currentMode } = await load();
    expect(await currentMode()).toBe("test");
  });

  it("stays real for a non-admin even with the cookie set", async () => {
    cookieValue = "test"; adminAnswer = false;
    const { currentMode } = await load();
    expect(await currentMode()).toBe("real");
  });

  it("treats an unknown cookie value as real", async () => {
    cookieValue = "sandbox"; adminAnswer = true;
    const { currentMode } = await load();
    expect(await currentMode()).toBe("real");
  });
});
