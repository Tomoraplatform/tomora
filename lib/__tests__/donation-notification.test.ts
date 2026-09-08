import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Telling an organisation that a gift arrived.
 *
 * A donation used to settle silently: the money moved and nothing was said, so
 * the only way to learn of it was to open the dashboard. These cover the two
 * things that make the notification trustworthy, that it is sent once on the
 * flip from pending to paid, and that a name typed by a stranger cannot put
 * markup into the owner's inbox.
 */

let donationRows: Record<string, unknown>[] = [];
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
    from(table: string) {
      if (table === "wallet_transactions") {
        return { insert: async () => ({ error: null }) };
      }
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
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: { email: "owner@hope.org" } }) }),
          }),
        };
      }
      // donations
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
  sent.length = 0;
  donationRows = [];
});

const toOwner = () => sent.find((m) => m.to === "owner@hope.org");
const toDonor = (address: string) => sent.find((m) => m.to === address);

describe("a donation that has just been paid", () => {
  beforeEach(() => {
    donationRows = [{
      site_id: "s1",
      amount: 25000,
      donor_name: "Ada Obi",
      donor_email: "ada@example.com",
      project_name: "Borehole fund",
      settled_direct: true,
    }];
  });

  it("tells the organisation, with the amount and who gave it", async () => {
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_1");

    const mail = toOwner();
    expect(mail, "the owner should have been emailed").toBeTruthy();
    expect(mail!.subject).toContain("Hope Foundation");
    expect(mail!.subject).toContain("25,000");
    expect(mail!.html).toContain("Ada Obi");
    expect(mail!.html).toContain("Borehole fund");
  });

  it("says where the money actually went", async () => {
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_1");
    // settled_direct means Paystack split it to their bank, not the wallet.
    expect(toOwner()!.html).toContain("bank account");
  });

  it("sends the donor a receipt they can keep", async () => {
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_1");

    const receipt = toDonor("ada@example.com");
    expect(receipt, "the donor should have been thanked").toBeTruthy();
    expect(receipt!.subject).toContain("Hope Foundation");
    expect(receipt!.html).toContain("25,000");
  });
});

describe("what must not happen", () => {
  it("says nothing when the donation was already paid", async () => {
    // No rows come back from the update, which is how the function knows the
    // reference had already been settled by another path.
    donationRows = [];
    const { confirmDonationPaid } = await load();
    const result = await confirmDonationPaid("don_already");

    expect(result.updated).toBe(false);
    expect(sent, "a second confirm must not re-notify anyone").toHaveLength(0);
  });

  it("still tells the owner when the donor left no email", async () => {
    donationRows = [{ site_id: "s1", amount: 5000, donor_name: null, donor_email: null }];
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_2");

    expect(toOwner()).toBeTruthy();
    expect(toOwner()!.html).toContain("Anonymous");
    expect(sent).toHaveLength(1); // owner only, nobody to thank
  });

  it("escapes a donor name so it cannot inject markup into the owner's inbox", async () => {
    donationRows = [{
      site_id: "s1",
      amount: 1000,
      donor_name: '<img src=x onerror="alert(1)">',
      donor_email: null,
    }];
    const { confirmDonationPaid } = await load();
    await confirmDonationPaid("don_3");

    const html = toOwner()!.html;
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });
});
