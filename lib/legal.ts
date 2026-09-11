/**
 * The date the legal pages last changed.
 *
 * Fixed rather than computed. These pages used `new Date().getFullYear()`,
 * which quietly relabelled an untouched document every January and told a
 * reader the terms had been reviewed when nothing had been read. A date on a
 * legal page is a claim, so it is edited by hand when the wording actually
 * changes.
 */
export const LEGAL_LAST_UPDATED = "11 September 2026";
