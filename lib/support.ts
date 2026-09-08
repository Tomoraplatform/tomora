/**
 * The address people write to.
 *
 * Public by nature: it is printed on the privacy and terms pages and shown in
 * the student portal, so it belongs in the source rather than an environment
 * variable. Keeping one constant is the point, the address a visitor reads and
 * the inbox a message actually reaches were drifting apart before this.
 *
 * Safe to import from client components: there is nothing secret here.
 */
export const SUPPORT_EMAIL = "support@tomora.com.ng";
