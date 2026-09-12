import type { SubaccountCheck } from "@/lib/paystack";

/**
 * What stops a store or donation site from taking money, worked out from what
 * Tomora has saved and what Paystack says about the site's payout account.
 *
 * Pure, so every rule is tested. The admin Payments health page gathers the
 * inputs and renders the result.
 */

export type Severity = "broken" | "warning";

export interface HealthIssue {
  severity: Severity;
  message: string;
  /** Whether the admin "Reconnect payouts" action can fix it from saved details. */
  repairable?: boolean;
}

export interface HealthInput {
  kind: "store" | "donations";
  isLive: boolean;
  subaccount: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  /** Saved checkout toggles; undefined means the default (on). */
  paystackOn?: boolean;
  transferOn?: boolean;
  allowBankTransfer: boolean;
  /** Paystack's view of `subaccount`; undefined when it could not be asked. */
  paystack?: SubaccountCheck | { error: string };
}

export function diagnose(input: HealthInput): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const canRepair = !!input.bankCode && !!input.accountNumber;
  const takesTransfer = input.kind === "store" && !!input.accountNumber && (input.transferOn ?? true) && input.allowBankTransfer;

  if (!input.isLive) {
    issues.push({ severity: "warning", message: "Not published, so customers cannot reach it." });
  }

  if (!input.subaccount) {
    // No payout account at all: online payment has never been possible.
    issues.push({
      severity: takesTransfer ? "warning" : "broken",
      message: input.kind === "donations"
        ? "No payout bank connected, so online giving is switched off."
        : takesTransfer
          ? "No payout bank connected: bank transfer only, no card payments."
          : "No payout bank connected and no bank transfer: customers have no way to pay.",
    });
    return issues;
  }

  const ps = input.paystack;
  if (!ps || "error" in ps) {
    issues.push({ severity: "warning", message: `Could not ask Paystack about the payout account${ps && "error" in ps ? ` (${ps.error})` : ""}.` });
  } else if (!ps.found) {
    issues.push({
      severity: "broken",
      message: `Paystack does not recognise this site's payout account (${ps.message || "not found"}). Card payments${input.kind === "donations" ? " and donations" : ""} fail with "Invalid Subaccount".`,
      repairable: canRepair,
    });
    if (!canRepair) {
      issues.push({ severity: "broken", message: "No saved bank details to rebuild it from: the owner must reconnect their payout bank." });
    }
  } else {
    if (ps.active === false) {
      issues.push({ severity: "broken", message: "The payout account is deactivated in Paystack, so payments to it fail.", repairable: canRepair });
    }
    if (ps.accountNumber && input.accountNumber && ps.accountNumber !== input.accountNumber) {
      issues.push({
        severity: "warning",
        message: `Paystack pays account ${ps.accountNumber}, but the dashboard shows ${input.accountNumber}.`,
      });
    }
    if (ps.percentageCharge != null && ps.percentageCharge !== 0) {
      issues.push({
        severity: "warning",
        message: `Paystack takes ${ps.percentageCharge}% of every payment to Tomora before the owner is paid. It should be 0%.`,
      });
    }
  }

  if (input.kind === "store") {
    const cardOffered = input.paystackOn ?? true;
    if (!cardOffered && !takesTransfer && input.allowBankTransfer) {
      issues.push({ severity: "broken", message: "Card payment and bank transfer are both switched off at checkout." });
    }
  }

  return issues;
}

export function worst(issues: HealthIssue[]): Severity | "ok" {
  if (issues.some((i) => i.severity === "broken")) return "broken";
  if (issues.length) return "warning";
  return "ok";
}
