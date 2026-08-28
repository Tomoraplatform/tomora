import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * What a paid renewal must do to a subscription.
 *
 * One of these is a regression guard with a story: a real payment used to
 * leave `comp_expires_at` from an earlier admin grant on the row. The
 * subscription went active, the site went live, and then the next visitor
 * tripped expireCompIfDue, which cancelled the subscription and took the site
 * straight back offline. It could only be undone by hand, and only until the
 * next visit.
 */

let subscriptionRow: Record<string, unknown> | null = null;
const updates: { table: string; payload: Record<string, unknown> }[] = [];
const inserts: { table: string; payload: Record<string, unknown> }[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/creator/money", () => ({
  creditPlatform: async () => {},
  recordTransaction: async () => {},
}));
vi.mock("@/lib/live/conversations", () => ({
  enqueueAndSend: async () => {},
  clearCartAfterPayment: async () => {},
}));
vi.mock("@/lib/tiktok/events-api", () => ({ sendTikTokEvent: async () => true }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    const chain = (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: table === "subscriptions" ? subscriptionRow : null }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        updates.push({ table, payload });
        return { eq: async () => ({ error: null }) };
      },
      insert: async (payload: Record<string, unknown>) => {
        inserts.push({ table, payload });
        return { error: null };
      },
    });
    return { from: chain };
  },
}));

const load = async () => await import("../billing");

beforeEach(() => {
  vi.resetModules();
  updates.length = 0;
  inserts.length = 0;
  subscriptionRow = null;
});

/** The payload written to the subscriptions table, whether update or insert. */
function subscriptionWrite() {
  return (
    updates.find((u) => u.table === "subscriptions")?.payload ??
    inserts.find((i) => i.table === "subscriptions")?.payload
  );
}

describe("applyPlatformPayment", () => {
  it("clears a comp date left over from an admin grant", async () => {
    // A user who was comped, whose comp then lapsed, and who has now paid.
    subscriptionRow = {
      id: "sub-1",
      plan: "starter",
      status: "cancelled",
      billing_cycle_position: 0,
      comp_expires_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      last_reference: "admin_grant_1",
    };

    const { applyPlatformPayment } = await load();
    await applyPlatformPayment("user-1", "tomplat_abc", "starter");

    const written = subscriptionWrite();
    expect(written).toBeDefined();
    // Without this the next visitor cancels the subscription again.
    expect(written!.comp_expires_at).toBeNull();
    expect(written!.status).toBe("active");
  });

  it("brings the site back online", async () => {
    subscriptionRow = { id: "sub-1", plan: "starter", status: "past_due", billing_cycle_position: 0 };
    const { applyPlatformPayment } = await load();
    await applyPlatformPayment("user-1", "tomplat_abc", "starter");

    const site = updates.find((u) => u.table === "sites");
    expect(site?.payload.is_live).toBe(true);
  });

  it("records the payment reference so the same webhook cannot settle twice", async () => {
    subscriptionRow = { id: "sub-1", plan: "starter", status: "active", billing_cycle_position: 0 };
    const { applyPlatformPayment } = await load();
    await applyPlatformPayment("user-1", "tomplat_xyz", "starter");
    expect(subscriptionWrite()!.last_reference).toBe("tomplat_xyz");
  });

  it("does nothing when the same reference arrives again", async () => {
    subscriptionRow = {
      id: "sub-1", plan: "starter", status: "active",
      billing_cycle_position: 0, last_reference: "tomplat_seen",
    };
    const { applyPlatformPayment } = await load();
    const res = await applyPlatformPayment("user-1", "tomplat_seen", "starter");

    expect(res).toEqual({ already: true });
    expect(updates).toHaveLength(0);
    expect(inserts).toHaveLength(0);
  });

  it("creates a subscription for a first payment, already free of any comp", async () => {
    subscriptionRow = null;
    const { applyPlatformPayment } = await load();
    await applyPlatformPayment("user-new", "tomplat_first", "starter");

    const written = subscriptionWrite();
    expect(written!.status).toBe("active");
    expect(written!.comp_expires_at).toBeNull();
  });
});

describe("isCompExpired", () => {
  it("is the trap the renewal used to fall into", async () => {
    const { isCompExpired } = await load();
    // An active subscription carrying a past comp date reads as expired, which
    // is exactly what a freshly paid renewal used to look like.
    expect(isCompExpired({ status: "active", comp_expires_at: "2020-01-01T00:00:00Z" })).toBe(true);
    // With the date cleared, a paid subscription is simply active.
    expect(isCompExpired({ status: "active", comp_expires_at: null })).toBe(false);
  });

  it("ignores comps that have not run out, and non-active subscriptions", async () => {
    const { isCompExpired } = await load();
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isCompExpired({ status: "active", comp_expires_at: future })).toBe(false);
    expect(isCompExpired({ status: "cancelled", comp_expires_at: "2020-01-01T00:00:00Z" })).toBe(false);
    expect(isCompExpired(null)).toBe(false);
  });
});
