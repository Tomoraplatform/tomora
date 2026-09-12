import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCompExpired } from "@/lib/billing";
import { FREE_PLAN_ID, PLANS, getPlan, type PlanId } from "@/lib/constants";
import { NO_FEE, validRate, type FeeRate } from "@/lib/platform-fee";

/**
 * Which transaction fee applies, and to whom.
 *
 * Rates start from the plan config in lib/constants.ts. A row in `plan_fees`
 * overrides a plan's rate, which is how the numbers are tuned without a
 * redeploy. A merchant who was already paying when the fee launched carries an
 * override on their subscription that keeps them at whatever the migration set
 * (0%), for as long as that subscription stays active.
 *
 * The fee only switches on once migration 0047 has run. Until then there is no
 * `plan_fees` table, no grandfathering and nowhere to record what was taken,
 * so checkout behaves exactly as it did before: no fee, bank transfer allowed.
 */

export type FeeRates = Record<string, FeeRate>;

function defaultRates(): FeeRates {
  const rates: FeeRates = {};
  // Legacy plans too, so an old subscriber resolves to a rate rather than to nothing.
  for (const id of [...PLANS.map((p) => p.id), "basic"]) {
    const p = getPlan(id);
    if (p) rates[p.id] = { percent: p.transactionFeePercent, flat: p.transactionFeeFlat };
  }
  return rates;
}

/**
 * Every plan's current rate, and whether fees are switched on at all.
 * `live` is false only when the `plan_fees` table cannot be read.
 */
export async function loadPlanFeeRates(): Promise<{ rates: FeeRates; live: boolean }> {
  const rates = defaultRates();
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("plan_fees").select("plan_id, fee_percent, fee_flat");
    if (error || !data) return { rates, live: false };
    for (const row of data as { plan_id: string; fee_percent: unknown; fee_flat: unknown }[]) {
      if (!(row.plan_id in rates)) continue;
      const rate = validRate(row.fee_percent, row.fee_flat);
      if (rate) rates[row.plan_id] = rate;
      else console.error(`[fees] plan_fees row for ${row.plan_id} is out of range; using the default`, row);
    }
    return { rates, live: true };
  } catch (err) {
    console.error("[fees] could not read plan_fees:", err);
    return { rates, live: false };
  }
}

export interface FeePolicy {
  planId: PlanId;
  rate: FeeRate;
  allowBankTransfer: boolean;
  /** True when the rate came from the merchant's own override, not their plan. */
  overridden: boolean;
}

/**
 * The fee policy for a site owner's customers.
 *
 * Throws if the subscription cannot be read. Guessing would be worse either
 * way: guess "free" and a paying merchant's customers are overcharged, guess
 * "paid" and the fee is silently waived. The checkout reports the error and
 * the customer tries again.
 */
export async function feePolicyForOwner(userId: string): Promise<FeePolicy> {
  const admin = createAdminClient();
  // `*` so the override columns can be absent on a database that has not run
  // migration 0047; naming them would fail the query outright.
  const { data: sub, error } = await admin
    .from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Could not read the store's plan: ${error.message}`);
  return policyFrom(sub as SubscriptionFeeFields | null, await loadPlanFeeRates());
}

export type SubscriptionFeeFields = {
  status?: string | null; plan?: string | null; comp_expires_at?: string | null;
  fee_percent_override?: unknown; fee_flat_override?: unknown;
};

/** The policy for one subscription row (or none), given the loaded rates. */
export function policyFrom(
  s: SubscriptionFeeFields | null,
  { rates, live }: { rates: FeeRates; live: boolean },
): FeePolicy {
  const active = !!s && s.status === "active" && !isCompExpired(s);
  // An active subscription with no plan recorded predates the plan column and
  // was Pro; the rest of the app reads it the same way.
  const plan = (active ? getPlan(s!.plan || "pro") : undefined) ?? getPlan(FREE_PLAN_ID)!;

  if (!live) return { planId: plan.id, rate: NO_FEE, allowBankTransfer: true, overridden: false };

  const override = active ? validRate(s!.fee_percent_override, s!.fee_flat_override) : null;
  return {
    planId: plan.id,
    rate: override ?? rates[plan.id] ?? NO_FEE,
    allowBankTransfer: plan.allowBankTransfer,
    overridden: !!override,
  };
}
