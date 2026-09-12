import { describe, expect, it } from "vitest";
import {
  stageOf, daysSince, isSelectable, greetingName, renderTemplate,
  OUTREACH_TEMPLATES, MAX_PER_SEND, type UserFacts, type Filters,
} from "../outreach";

/**
 * Who ends up on an outreach list, and what the message says when it goes out.
 * These rules decide who gets mail from a real business to real people, so the
 * ones that keep someone OFF the list matter most.
 */

const DAY = 86_400_000;
const now = Date.UTC(2026, 8, 12);
const ago = (days: number) => new Date(now - days * DAY).toISOString();

const base: UserFacts = {
  createdAt: ago(30), hasSite: true, isLive: true, isStore: true,
  productCount: 3, paidOrderCount: 0, subscriptionActive: false, email: "ada@example.com",
};

const filters: Filters = { stages: ["no_site", "unpublished", "no_products", "no_sales"], minAgeDays: 7, quietDays: 30 };

describe("stageOf", () => {
  it("says how far someone got", () => {
    expect(stageOf({ ...base, hasSite: false })).toBe("no_site");
    expect(stageOf({ ...base, isLive: false })).toBe("unpublished");
    expect(stageOf({ ...base, productCount: 0 })).toBe("no_products");
    expect(stageOf(base)).toBe("no_sales");
  });

  it("counts anyone paying, or being paid, as active", () => {
    expect(stageOf({ ...base, paidOrderCount: 1 })).toBe("active");
    expect(stageOf({ ...base, subscriptionActive: true })).toBe("active");
    // A subscriber who never even built a site is still a customer, not a lead.
    expect(stageOf({ ...base, hasSite: false, subscriptionActive: true })).toBe("active");
  });

  it("does not ask a non-store for products", () => {
    expect(stageOf({ ...base, isStore: false, productCount: 0 })).toBe("no_sales");
  });
});

describe("isSelectable", () => {
  it("includes a dormant account that matches the filters", () => {
    expect(isSelectable(base, filters, now)).toBe(true);
  });

  it("never includes someone who opted out, whatever the filters say", () => {
    expect(isSelectable({ ...base, optedOut: true }, filters, now)).toBe(false);
    expect(isSelectable({ ...base, optedOut: true }, { ...filters, minAgeDays: 0, quietDays: 0 }, now)).toBe(false);
  });

  it("never includes an account with no address", () => {
    expect(isSelectable({ ...base, email: null }, filters, now)).toBe(false);
    expect(isSelectable({ ...base, email: "" }, filters, now)).toBe(false);
  });

  it("leaves out people who only just signed up", () => {
    expect(isSelectable({ ...base, createdAt: ago(2) }, filters, now)).toBe(false);
    expect(isSelectable({ ...base, createdAt: ago(7) }, filters, now)).toBe(true);
  });

  it("leaves out anyone emailed recently, so nobody is mailed twice in a week", () => {
    expect(isSelectable({ ...base, lastContactedAt: ago(3) }, filters, now)).toBe(false);
    expect(isSelectable({ ...base, lastContactedAt: ago(31) }, filters, now)).toBe(true);
    // Quiet period off: a previous email no longer excludes them.
    expect(isSelectable({ ...base, lastContactedAt: ago(3) }, { ...filters, quietDays: 0 }, now)).toBe(true);
  });

  it("leaves out stages that were not asked for, active customers included", () => {
    expect(isSelectable({ ...base, paidOrderCount: 2 }, filters, now)).toBe(false);
  });
});

describe("greetingName", () => {
  it("prefers the business name", () => {
    expect(greetingName("Ada Stores", "ada@example.com")).toBe("Ada Stores");
  });

  it("falls back to a readable name from the address", () => {
    expect(greetingName("", "tolu.adeyemi@example.com")).toBe("tolu adeyemi");
    expect(greetingName(null, null)).toBe("there");
  });
});

describe("renderTemplate", () => {
  const vars = { name: "Ada Stores", site: "ada.tomora.com.ng", dashboard: "https://x/dashboard", booking: "https://cal/x" };

  it("fills every placeholder, with or without spaces", () => {
    expect(renderTemplate("Hi {{name}}, visit {{ site }}.", vars)).toBe("Hi Ada Stores, visit ada.tomora.com.ng.");
  });

  it("leaves an unknown placeholder alone, so a typo shows in the preview", () => {
    expect(renderTemplate("Hi {{nmae}}", vars)).toBe("Hi {{nmae}}");
  });

  it("fills the shipped templates completely", () => {
    for (const t of OUTREACH_TEMPLATES) {
      const out = renderTemplate(t.body, vars);
      expect(out, t.id).not.toMatch(/\{\{/);
      expect(t.subject.length, t.id).toBeGreaterThan(10);
    }
  });
});

describe("daysSince", () => {
  it("counts whole days, and copes with nothing", () => {
    expect(daysSince(ago(5), now)).toBe(5);
    expect(daysSince(null)).toBeNull();
    expect(daysSince("not a date")).toBeNull();
  });
});

describe("the send cap", () => {
  it("is small enough to protect the sending domain", () => {
    expect(MAX_PER_SEND).toBeLessThanOrEqual(100);
  });
});
