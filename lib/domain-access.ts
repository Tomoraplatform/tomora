import { getPlan } from "./constants";

/**
 * Decides whether a site may connect a custom domain.
 *  - Always allowed if the site has purchased the ₦8,000 domain add-on.
 *  - Otherwise allowed only when the plan includes a domain AND this is the
 *    user's primary (first) site.
 */
export function domainAccess(opts: {
  isPrimary: boolean;
  domainPurchased: boolean;
  planId: string | null | undefined;
  subActive: boolean;
}): { canConnect: boolean; included: boolean; needsPurchase: boolean } {
  if (opts.domainPurchased) return { canConnect: true, included: false, needsPurchase: false };
  const plan = opts.subActive ? getPlan(opts.planId || "") : undefined;
  const included = !!(plan?.includesDomain && opts.isPrimary);
  return { canConnect: included, included, needsPurchase: !included };
}
