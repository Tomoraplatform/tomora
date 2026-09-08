import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Reaching the owner of an existing store.
 *
 * Order and donation emails are addressed by looking the owner up at payment
 * time, not by anything captured at signup, so they apply to every account that
 * already exists. The one way that quietly fails is a profile carrying no
 * email, which produces silence on every sale that owner ever makes. These pin
 * the fallback to the address the account was registered with.
 */

let donationRows: Record<string, unknown>[] = [];
let profileEmail: string | null = "owner@profile.test";
let authEmail: string | null = "owner@account.test";
const sent: { to: string | string[]; subject: string; html: string }[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/creator/money", () => ({
  creditPlatform: async () => {},
  recordTransaction: async () => {},
}));
vi.mock("@/lib/live/conversations", () => ({
  enqueueAndSend: async () => {},
  clearCartAfterPayment: async () => {},
}));
vi.mock("@/lib/live/messages", () => ({ text: (t: string) => ({ type: "text", text: { body: t } }) }));
vi.mock("@/lib/paystack", () => ({ verifyTransaction: async () => ({ success: false }) }));
vi.mock("@/lib/email", () => ({
  sendEmail: async (p: { to: string | string[]; subject: string; html: string }) => {
    sent.push(p);
    return true;
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { getUserById: async () => ({ data: { user: authEmail ? { email: authEmail } : null } }) } },
    from(table: string) {
      if (table === "wallet_transactions") return { insert: async () => ({ error: null }) };
      if (table === "sites") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { user_id: "owner-1", site_data: { businessName: "Hope Foundation" } },
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { email: profileEmail } }) }) }),
        };
      }
      return {
        update: () => ({
          eq: () => ({ eq: () => ({ select: async () => ({ data: donationRows, error: null }) }) }),
        }),
      };
    },
  }),
}));

const load = async () => await import("../confirm-payments");

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  sent.length = 0;
  profileEmail = "owner@profile.test";
  authEmail = "owner@account.test";
  donationRows = [{ site_id: "s1", amount: 10000, donor_name: "Ada", donor_email: null }];
});

describe("who the owner notification goes to", () => {
  it("uses the address on the profile, which the owner can change", async () => {
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_1");
    expect(sent.some((m) => m.to === "owner@profile.test")).toBe(true);
  });

  it("falls back to the account address when the profile has none", async () => {
    // An older account, or one whose profile was written another way. Without
    // the fallback this owner never hears about a single sale.
    profileEmail = null;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_2");

    expect(sent.some((m) => m.to === "owner@account.test")).toBe(true);
  });

  it("treats a blank profile email as missing, not as an address", async () => {
    profileEmail = "   ";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_3");

    expect(sent.some((m) => m.to === "owner@account.test")).toBe(true);
    expect(sent.some((m) => String(m.to).trim() === "")).toBe(false);
  });

  it("sends nothing rather than something broken when there is no address at all", async () => {
    profileEmail = null;
    authEmail = null;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { confirmDonationPaid } = await load();
    const result = await confirmDonationPaid("don_4");

    // The donation still settles; only the notification is skipped.
    expect(result.updated).toBe(true);
    expect(sent).toHaveLength(0);
  });
});
