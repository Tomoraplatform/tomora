import { describe, expect, it } from "vitest";
import { diagnose, worst, type HealthInput } from "../payments-health";

/** The rules behind the admin Payments health page. */

const healthyStore: HealthInput = {
  kind: "store", isLive: true, subaccount: "ACCT_ok", bankCode: "058", accountNumber: "0123456789",
  allowBankTransfer: true,
  paystack: { found: true, active: true, accountNumber: "0123456789", percentageCharge: 0 },
};

describe("diagnose", () => {
  it("passes a store Paystack knows, paying the right bank at 0%", () => {
    expect(diagnose(healthyStore)).toEqual([]);
    expect(worst(diagnose(healthyStore))).toBe("ok");
  });

  it("marks the 'Invalid Subaccount' case broken, and repairable from saved bank details", () => {
    const issues = diagnose({ ...healthyStore, paystack: { found: false, message: "Subaccount not found" } });
    expect(worst(issues)).toBe("broken");
    expect(issues[0].message).toMatch(/Invalid Subaccount/);
    expect(issues[0].repairable).toBe(true);
  });

  it("says the owner must reconnect when there are no bank details to rebuild from", () => {
    const issues = diagnose({ ...healthyStore, bankCode: null, paystack: { found: false } });
    expect(issues.some((i) => i.repairable)).toBe(false);
    expect(issues.map((i) => i.message).join(" ")).toMatch(/owner must reconnect/);
  });

  it("flags a deactivated payout account", () => {
    expect(worst(diagnose({ ...healthyStore, paystack: { found: true, active: false } }))).toBe("broken");
  });

  it("warns when Paystack pays a different account from the one the dashboard shows", () => {
    const issues = diagnose({ ...healthyStore, paystack: { found: true, active: true, accountNumber: "9999999999", percentageCharge: 0 } });
    expect(worst(issues)).toBe("warning");
  });

  it("warns when the subaccount takes a percentage the owner never agreed to", () => {
    const issues = diagnose({ ...healthyStore, paystack: { found: true, active: true, accountNumber: "0123456789", percentageCharge: 5 } });
    expect(issues[0].message).toMatch(/5%/);
  });

  it("treats a store with no payout bank as transfer-only, or as unable to take money on Free", () => {
    const noSub = { ...healthyStore, subaccount: null, paystack: undefined };
    expect(worst(diagnose(noSub))).toBe("warning");
    expect(worst(diagnose({ ...noSub, allowBankTransfer: false }))).toBe("broken");
  });

  it("marks a donation site with no payout bank broken, since giving is card-only", () => {
    expect(worst(diagnose({ ...healthyStore, kind: "donations", subaccount: null, paystack: undefined }))).toBe("broken");
  });

  it("flags a store with every payment method switched off", () => {
    const issues = diagnose({ ...healthyStore, paystackOn: false, transferOn: false });
    expect(worst(issues)).toBe("broken");
  });

  it("does not call a Paystack outage a broken store", () => {
    expect(worst(diagnose({ ...healthyStore, paystack: { error: "timeout" } }))).toBe("warning");
  });
});
