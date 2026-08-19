import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Sandbox data is kept apart by a flag on shared tables, which only works while
 * every read says which world it wants. A query added later that forgets the
 * flag would silently pour test money into a seller's real takings, and nothing
 * about it would look wrong in review.
 *
 * So this walks the source and fails if an orders or wallet query is missing
 * the filter. It is a guard against omission, which is the one mistake this
 * design is exposed to.
 */

const ROOT = join(__dirname, "..", "..");
const SEARCH_DIRS = ["app", "lib", "components"];

/** Files allowed to touch these tables without a mode filter, with the reason. */
const EXEMPT: Record<string, string> = {
  "lib/orders/query.ts": "defines the filters",
  "app/dashboard/(panel)/sandbox/actions.ts": "writes and deletes test rows by design",
  "lib/confirm-payments.ts": "settles a Paystack reference, which a test order can never have",
  "app/api/checkout/route.ts": "creates real orders only, never sets is_test",
  // Fulfilment updates one row by its id. The row already belongs to a world,
  // so asking which world to update would be meaningless: marking a test order
  // fulfilled is exactly the point of the sandbox.
  "app/dashboard/store-actions.ts": "updates a single order by id, never reads a set",
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Every source file that queries one of the shared tables. */
function filesQuerying(table: string): { rel: string; body: string }[] {
  const hits: { rel: string; body: string }[] = [];
  for (const dir of SEARCH_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const body = readFileSync(file, "utf8");
      if (body.includes(`from("${table}")`)) {
        hits.push({ rel: file.slice(ROOT.length + 1), body });
      }
    }
  }
  return hits;
}

/** The filter can be applied through the helpers or inline; both count. */
const FILTERED = /is_test|scopeToMode|realOnly/;

describe("sandbox isolation", () => {
  it("every file querying orders declares real or test", () => {
    const offenders = filesQuerying("orders")
      .filter((f) => !EXEMPT[f.rel])
      .filter((f) => !FILTERED.test(f.body))
      .map((f) => f.rel);
    expect(offenders, `these read orders without saying which world:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("every file querying wallet_transactions declares real or test", () => {
    const offenders = filesQuerying("wallet_transactions")
      .filter((f) => !EXEMPT[f.rel])
      .filter((f) => !FILTERED.test(f.body))
      .map((f) => f.rel);
    expect(offenders, `these read the wallet without saying which world:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("the payout balance is real money only", () => {
    const body = readFileSync(join(ROOT, "app/dashboard/(panel)/wallet/actions.ts"), "utf8");
    // A withdrawal is paid against this sum, so it must be pinned to real rows
    // rather than following whatever mode the admin happens to be in.
    expect(body).toContain('.eq("is_test", false)');
    expect(body).not.toContain('mode === "test"');
  });

  it("the public storefront never serves demo products", () => {
    const body = readFileSync(join(ROOT, "lib/published.ts"), "utf8");
    expect(body).toMatch(/excludeTestProducts|is_test_only/);
  });

  it("checkout cannot create a test order", () => {
    const body = readFileSync(join(ROOT, "app/api/checkout/route.ts"), "utf8");
    expect(body).not.toMatch(/is_test:\s*true/);
  });
});
