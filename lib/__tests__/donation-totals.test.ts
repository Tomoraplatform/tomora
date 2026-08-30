import { describe, expect, it } from "vitest";
import { summariseDonations } from "../donations/totals";

/**
 * Attributing gifts to fundraising projects.
 *
 * The complaint that produced these: the amount on a project card climbed but
 * the "N gifts" line under it did not. Two separate causes, both here — a paid
 * gift that matched no current project was thrown away entirely, and offline
 * gifts recorded by the owner moved money without ever moving a count.
 */

const P = (id: string, extra: Record<string, unknown> = {}) => ({ id, name: id, ...extra });

describe("summariseDonations", () => {
  it("counts a gift against the project it was given to", () => {
    const { projects, unassigned } = summariseDonations(
      [{ amount: 5000, project_id: "a" }, { amount: 3000, project_id: "a" }],
      [P("a"), P("b")]
    );
    expect(projects.a).toMatchObject({ raised: 8000, count: 2 });
    expect(projects.b).toMatchObject({ raised: 0, count: 0 });
    expect(unassigned).toEqual({ raised: 0, count: 0 });
  });

  it("keeps a gift that belongs to no project instead of dropping it", () => {
    // This is the bug: it used to vanish from every card while the site-wide
    // total still counted it, so the figures never added up.
    const { projects, unassigned } = summariseDonations(
      [{ amount: 1000, project_id: null }, { amount: 2000, project_id: "a" }],
      [P("a")]
    );
    expect(projects.a).toMatchObject({ raised: 2000, count: 1 });
    expect(unassigned).toEqual({ raised: 1000, count: 1 });
  });

  it("rescues gifts orphaned when a project was edited and given a new id", () => {
    const { projects, unassigned } = summariseDonations(
      [{ amount: 4000, project_id: "old-id", project_name: "Bibles" }],
      [{ id: "new-id", name: "Bibles" }]
    );
    expect(projects["new-id"]).toMatchObject({ raised: 4000, count: 1 });
    expect(unassigned.count).toBe(0);
  });

  it("matches an orphan by name regardless of case or padding", () => {
    const { projects } = summariseDonations(
      [{ amount: 1000, project_id: "gone", project_name: "  bibles  " }],
      [{ id: "p1", name: "Bibles" }]
    );
    expect(projects.p1.count).toBe(1);
  });

  it("treats a deleted project's gifts as unassigned when no name matches", () => {
    const { projects, unassigned } = summariseDonations(
      [{ amount: 7000, project_id: "deleted", project_name: "Old campaign" }],
      [P("a")]
    );
    expect(projects.a.count).toBe(0);
    expect(unassigned).toEqual({ raised: 7000, count: 1 });
  });

  it("counts the offline gifts the owner recorded, not just the money", () => {
    // Recording cash used to move the bar while the count stayed still.
    const { projects } = summariseDonations([], [P("a", { manualRaised: 90000, manualCount: 12 })]);
    expect(projects.a).toMatchObject({ raised: 90000, count: 12, manual: 90000, manualCount: 12 });
  });

  it("adds online gifts on top of the offline ones", () => {
    const { projects } = summariseDonations(
      [{ amount: 5000, project_id: "a" }],
      [P("a", { manualRaised: 20000, manualCount: 3 })]
    );
    expect(projects.a).toMatchObject({ raised: 25000, count: 4 });
  });

  it("keeps the offline portion separable, so the card can re-add live edits", () => {
    const { projects } = summariseDonations(
      [{ amount: 5000, project_id: "a" }],
      [P("a", { manualRaised: 20000, manualCount: 3 })]
    );
    expect(projects.a.raised - projects.a.manual).toBe(5000);
    expect(projects.a.count - projects.a.manualCount).toBe(1);
  });

  it("never lets a stray value make a total negative or fractional", () => {
    const { projects, unassigned } = summariseDonations(
      [{ amount: -500, project_id: "a" }, { amount: 10.6, project_id: "a" }, { amount: null }],
      [P("a", { manualRaised: -100, manualCount: -4 })]
    );
    expect(projects.a.raised).toBe(11);
    expect(projects.a.count).toBe(2);
    expect(projects.a.manual).toBe(0);
    expect(unassigned.count).toBe(1);
  });

  it("does not let two projects sharing a name swallow each other's gifts", () => {
    const { projects } = summariseDonations(
      [{ amount: 1000, project_id: "gone", project_name: "Fund" }],
      [{ id: "first", name: "Fund" }, { id: "second", name: "Fund" }]
    );
    expect(projects.first.count).toBe(1);
    expect(projects.second.count).toBe(0);
  });

  it("adds up: every paid gift lands somewhere", () => {
    const gifts = [
      { amount: 1000, project_id: "a" },
      { amount: 2000, project_id: null },
      { amount: 3000, project_id: "gone", project_name: "nothing like this" },
      { amount: 4000, project_id: "b" },
    ];
    const { projects, unassigned } = summariseDonations(gifts, [P("a"), P("b")]);
    const online =
      (projects.a.raised - projects.a.manual) +
      (projects.b.raised - projects.b.manual) +
      unassigned.raised;
    const counted =
      (projects.a.count - projects.a.manualCount) +
      (projects.b.count - projects.b.manualCount) +
      unassigned.count;
    expect(online).toBe(10000);
    expect(counted).toBe(gifts.length);
  });

  it("handles a site with no projects at all", () => {
    const { projects, unassigned } = summariseDonations([{ amount: 500 }], []);
    expect(projects).toEqual({});
    expect(unassigned).toEqual({ raised: 500, count: 1 });
  });
});
