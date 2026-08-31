import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Where a payment ends up, and what the wallet is allowed to offer.
 *
 * Store sales and donations paid by card split at Paystack to the payout
 * account the owner connected, so the money lands in their bank and never
 * passes through Tomora. The wallet still records it, because owners read
 * their history there, but it must not count towards a withdrawable balance:
 * paying it out would mean Tomora paying for the sale a second time.
 */

let orderRows: Record<string, unknown>[] = [];
let donationRows: Record<string, unknown>[] = [];
const walletWrites: Record<string, unknown>[] = [];

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
vi.mock("@/lib/email", () => ({ sendEmail: async () => {} }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === "wallet_transactions") {
        return { insert: async (row: Record<string, unknown>) => { walletWrites.push(row); return { error: null }; } };
      }
      if (table === "sites") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { user_id: "owner-1" } }) }) }) };
      }
      if (table === "orders") {
        const rows = orderRows;
        return {
          select: () => ({ eq: () => ({ eq: async () => ({ data: rows }) }) }),
          update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
        };
      }
      // donations
      return {
        update: () => ({
          eq: () => ({ eq: () => ({ select: async () => ({ data: donationRows, error: null }) }) }),
        }),
        select: () => ({ eq: () => ({ eq: () => ({ gte: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }) }) }) }),
      };
    },
  }),
}));

const load = async () => await import("../confirm-payments");

beforeEach(() => {
  vi.resetModules();
  walletWrites.length = 0;
  orderRows = [];
  donationRows = [];
});

/** What the wallet page and the withdrawal check both count as spendable. */
const withdrawable = () =>
  walletWrites
    .filter((w) => w.type === "income" && w.status === "completed")
    .reduce((s, w) => s + Number(w.amount || 0), 0);

describe("a card sale that settled to the owner's own bank", () => {
  beforeEach(() => {
    orderRows = [
      { id: "o1", site_id: "s1", buyer_name: "Ada", amount: 20000, settled_direct: true, channel: "web" },
      { id: "o2", site_id: "s1", buyer_name: "Ada", amount: 5000, settled_direct: true, channel: "web" },
    ];
  });

  it("is recorded in the wallet so the owner can see it", async () => {
    const { confirmOrdersPaid } = await load();
    await confirmOrdersPaid("tom_1");
    expect(walletWrites).toHaveLength(1);
    expect(walletWrites[0].amount).toBe(25000);
  });

  it("is not withdrawable, because Tomora never held it", async () => {
    const { confirmOrdersPaid } = await load();
    await confirmOrdersPaid("tom_1");
    expect(walletWrites[0].status).toBe("settled");
    expect(withdrawable()).toBe(0);
  });

  it("says where the money went", async () => {
    const { confirmOrdersPaid } = await load();
    await confirmOrdersPaid("tom_1");
    expect(String(walletWrites[0].description)).toMatch(/paid to your bank/i);
  });
});

describe("money Tomora does hold", () => {
  it("stays withdrawable for a sale that did not split", async () => {
    // Older rows, and anything settled before migration 0044, carry no flag.
    orderRows = [{ id: "o1", site_id: "s1", buyer_name: "Ada", amount: 12000, channel: "web" }];
    const { confirmOrdersPaid } = await load();
    await confirmOrdersPaid("tom_2");
    expect(walletWrites[0].status).toBe("completed");
    expect(withdrawable()).toBe(12000);
  });

  it("stays withdrawable for a WhatsApp order, less Tomora Live's cut", async () => {
    // Live collects into Tomora's balance so its commission can be taken, so
    // that money really is Tomora's to pay out.
    orderRows = [{ id: "o1", site_id: "s1", buyer_name: "Ada", amount: 10000, channel: "whatsapp" }];
    const { confirmOrdersPaid } = await load();
    await confirmOrdersPaid("tomwa_1");
    expect(walletWrites[0].status).toBe("completed");
    expect(walletWrites[0].amount).toBe(9700); // 3% to Tomora Live
  });
});

describe("donations", () => {
  it("are recorded but not withdrawable when they went straight to the bank", async () => {
    donationRows = [{ site_id: "s1", amount: 15000, donor_name: "Tolu", settled_direct: true }];
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_1");
    expect(walletWrites[0].amount).toBe(15000);
    expect(walletWrites[0].status).toBe("settled");
    expect(withdrawable()).toBe(0);
  });

  it("stay withdrawable when they were collected into Tomora's balance", async () => {
    donationRows = [{ site_id: "s1", amount: 15000, donor_name: "Tolu" }];
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_2");
    expect(walletWrites[0].status).toBe("completed");
    expect(withdrawable()).toBe(15000);
  });
});
