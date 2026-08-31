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

  it("Tomora never offers to pay out money it does not hold", () => {
    // Customers pay straight into the owner's own bank through Paystack, so
    // there is no balance here to withdraw. This used to check that the payout
    // sum was pinned to real rows; the safer property now is that the payout
    // path is gone rather than sitting behind a disabled button.
    const body = readFileSync(join(ROOT, "app/dashboard/(panel)/wallet/actions.ts"), "utf8");
    expect(body).not.toMatch(/initiateTransfer|createTransferRecipient/);
    expect(body).not.toMatch(/export async function withdraw/);
  });

  it("the received total still separates sandbox money from real", () => {
    const body = readFileSync(join(ROOT, "app/dashboard/(panel)/wallet/page.tsx"), "utf8");
    expect(body).toMatch(/is_test/);
  });

  it("the public storefront never serves demo products", () => {
    const body = readFileSync(join(ROOT, "lib/published.ts"), "utf8");
    expect(body).toMatch(/excludeTestProducts|is_test_only/);
  });

  it("checkout only ever writes a test order for a demo store", () => {
    const body = readFileSync(join(ROOT, "app/api/checkout/route.ts"), "utf8");
    // A demo storefront settles as a test order. Every other store must write
    // is_test from that same flag, never a bare true.
    expect(body).toContain("const isDemo = !!site.is_demo;");
    expect(body).toMatch(/is_test:\s*isDemo/);
    // Before the demo branch, nothing may hardcode a test row: the order rows
    // themselves must take the flag from isDemo.
    const beforeDemoBranch = body.slice(0, body.indexOf("if (isDemo) {"));
    expect(beforeDemoBranch).not.toMatch(/is_test:\s*true/);
  });

  it("a demo checkout never reaches the payment processor or email", () => {
    const body = readFileSync(join(ROOT, "app/api/checkout/route.ts"), "utf8");
    const demoBranch = body.slice(body.indexOf("if (isDemo) {"));
    const returnsBeforePaystack = demoBranch.indexOf("return NextResponse.json") < demoBranch.indexOf("initTransaction");
    expect(returnsBeforePaystack).toBe(true);
    // notify() is what sends the owner and buyer their emails.
    expect(demoBranch.slice(0, demoBranch.indexOf("return NextResponse.json"))).not.toContain("notify(");
  });
});
