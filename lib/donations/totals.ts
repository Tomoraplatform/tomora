/**
 * How a paid gift is attributed to a fundraising project.
 *
 * Shared by the public progress bars and the owner's dashboard, because the
 * two showing different numbers for the same project is worse than either
 * number being wrong.
 *
 * The rule that matters: no paid gift is ever dropped. Attribution used to
 * skip anything without a matching project id, which silently hid both the
 * money and the gift from every card while the site-wide total still counted
 * it. Anything that cannot be placed lands in `unassigned` instead, so the
 * page adds up.
 */

export interface PaidGift {
  amount?: number | null;
  project_id?: string | null;
  project_name?: string | null;
}

export interface ProjectDef {
  id: string;
  name?: string;
  /** Money received off-platform, entered by the owner. */
  manualRaised?: number;
  /** How many gifts that money represents. */
  manualCount?: number;
}

export interface ProjectTotal {
  raised: number;
  count: number;
  /** The offline portion, so callers can separate it back out. */
  manual: number;
  manualCount: number;
}

const whole = (n: unknown) => Math.max(0, Math.round(Number(n) || 0));
const key = (s: unknown) => String(s ?? "").trim().toLowerCase();

export interface DonationSummary {
  projects: Record<string, ProjectTotal>;
  unassigned: { raised: number; count: number };
}

export function summariseDonations(gifts: PaidGift[], defs: ProjectDef[]): DonationSummary {
  const projects: Record<string, ProjectTotal> = {};
  const idByName = new Map<string, string>();

  for (const p of defs) {
    if (!p?.id) continue;
    const manual = whole(p.manualRaised);
    const manualCount = whole(p.manualCount);
    projects[p.id] = { raised: manual, count: manualCount, manual, manualCount };
    const k = key(p.name);
    // First definition wins, so two projects sharing a name cannot swallow
    // each other's gifts.
    if (k && !idByName.has(k)) idByName.set(k, p.id);
  }

  const unassigned = { raised: 0, count: 0 };

  for (const g of gifts || []) {
    const amount = whole(g.amount);
    // Editing a project and saving it can mint a new id, orphaning the gifts
    // recorded under the old one. The name they were given under still
    // matches, so fall back to that before giving up on them.
    const id =
      g.project_id && projects[g.project_id]
        ? g.project_id
        : idByName.get(key(g.project_name));

    if (!id) {
      unassigned.raised += amount;
      unassigned.count += 1;
      continue;
    }
    projects[id].raised += amount;
    projects[id].count += 1;
  }

  return { projects, unassigned };
}
