/**
 * Compatibility rules engine.
 *
 * Decides, for the customer's current choices, which bases and ingredients
 * are available, recommended, or blocked (greyed out), and why.
 *
 * It has no knowledge of specific ingredients. It reads phases, pH windows
 * and tags from the catalog, so new ingredients work without code changes.
 * The same functions run in the browser (to grey options out) and on the
 * server (to re-check a formula before it goes to checkout).
 */

import {
  MAX_ACTIVES,
  MIN_PH_OVERLAP,
  PAIR_CONFLICTS,
  SKIN_BLOCKS,
  getAddition,
  getBase,
} from "./catalog";
import type { Addition, Base, PhWindow, Selection, Tag } from "./catalog";

export type Status = "available" | "recommended" | "blocked";

export interface Verdict {
  status: Status;
  /** Set when status is "blocked". Written for the customer. */
  reason?: string;
}

export interface Removal {
  id: string;
  name: string;
  reason: string;
}

export const EMPTY_SELECTION: Selection = {
  productType: null,
  skinType: null,
  baseId: null,
  activeIds: [],
  boosterIds: [],
};

/* ------------------------------ pH helpers ------------------------------ */

export function intersect(a: PhWindow, b: PhWindow): PhWindow {
  return { min: Math.max(a.min, b.min), max: Math.min(a.max, b.max) };
}

/** Width of a window. Negative or tiny means the two sides do not overlap. */
function width(w: PhWindow): number {
  return Math.round((w.max - w.min) * 100) / 100;
}

function overlaps(a: PhWindow, b: PhWindow): boolean {
  return width(intersect(a, b)) >= MIN_PH_OVERLAP;
}

export function formatPh(w: PhWindow): string {
  const f = (n: number) => (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1));
  return `${f(w.min)} to ${f(w.max)}`;
}

/**
 * The pH range the finished formula must sit in: the overlap of the base and
 * every water-phase-relevant ingredient. Returns null for a water-free base.
 */
export function formulaPh(base: Base | undefined, additions: Addition[]): PhWindow | null {
  if (!base || !base.ph) return null;
  return additions.reduce((w, a) => intersect(w, a.ph), base.ph);
}

/* ------------------------------ lookups ------------------------------ */

export function selectedAdditions(sel: Selection): Addition[] {
  return [...sel.activeIds, ...sel.boosterIds]
    .map((id) => getAddition(id))
    .filter((a): a is Addition => Boolean(a));
}

function skinBlockReason(tags: Tag[], sel: Selection): string | undefined {
  if (!sel.skinType) return undefined;
  const rule = SKIN_BLOCKS[sel.skinType].find(
    (r) => tags.includes(r.tag) && (!r.productType || r.productType === sel.productType),
  );
  return rule?.reason;
}

/* ------------------------------ verdicts ------------------------------ */

export function evaluateBase(base: Base, sel: Selection): Verdict {
  const blocked = skinBlockReason(base.tags, sel);
  if (blocked) return { status: "blocked", reason: blocked };
  if (sel.skinType && base.bestFor.includes(sel.skinType)) return { status: "recommended" };
  return { status: "available" };
}

/**
 * Checks one ingredient against the base and against the given other
 * ingredients. `others` must not include the ingredient itself.
 */
function evaluateAgainst(
  add: Addition,
  sel: Selection,
  base: Base | undefined,
  others: Addition[],
  enforceLimit: boolean,
): Verdict {
  if (!base) return { status: "blocked", reason: "Choose a base first." };

  // 1. Phase: the base must contain something to dissolve it in.
  if (!base.phases.includes(add.phase)) {
    return {
      status: "blocked",
      reason:
        add.phase === "oil"
          ? `${add.name} is oil-soluble, and ${base.name} contains no oil to dissolve it in.`
          : `${add.name} is water-soluble, and ${base.name} contains no water to dissolve it in.`,
    };
  }

  // 2. Skin type.
  const skin = skinBlockReason(add.tags, sel);
  if (skin) return { status: "blocked", reason: skin };

  // 3. Ingredient types that never share a formula.
  for (const other of others) {
    const conflict = PAIR_CONFLICTS.find(
      (c) =>
        (add.tags.includes(c.a) && other.tags.includes(c.b)) ||
        (add.tags.includes(c.b) && other.tags.includes(c.a)),
    );
    if (conflict) {
      return {
        status: "blocked",
        reason: `${conflict.reason} Remove ${other.name} to choose this.`,
      };
    }
  }

  // 4. pH: everything in a water-containing formula shares one pH.
  if (base.ph) {
    if (!overlaps(base.ph, add.ph)) {
      return {
        status: "blocked",
        reason: `${add.name} needs pH ${formatPh(add.ph)}. ${base.name} is held at pH ${formatPh(base.ph)}.`,
      };
    }
    const clash = others.find((o) => !overlaps(o.ph, add.ph));
    if (clash) {
      return {
        status: "blocked",
        reason: `${add.name} needs pH ${formatPh(add.ph)} and ${clash.name} needs pH ${formatPh(clash.ph)}, so they can't share one formula. Remove ${clash.name} to choose this.`,
      };
    }
    const current = formulaPh(base, others);
    if (current && !overlaps(current, add.ph)) {
      return {
        status: "blocked",
        reason: `${add.name} needs pH ${formatPh(add.ph)}. Your other choices have set this formula to pH ${formatPh(current)}.`,
      };
    }
  }

  // 5. Room in the formula.
  if (enforceLimit && add.kind === "active") {
    const activeCount = others.filter((o) => o.kind === "active").length;
    if (activeCount >= MAX_ACTIVES) {
      return {
        status: "blocked",
        reason: `A formula holds up to ${MAX_ACTIVES} actives. Remove one to add this.`,
      };
    }
  }

  if (sel.skinType && add.bestFor.includes(sel.skinType)) return { status: "recommended" };
  return { status: "available" };
}

/** Verdict for one ingredient given everything else the customer has chosen. */
export function evaluateAddition(add: Addition, sel: Selection): Verdict {
  const all = selectedAdditions(sel);
  const isSelected = all.some((a) => a.id === add.id);
  const others = all.filter((a) => a.id !== add.id);
  return evaluateAgainst(add, sel, getBase(sel.baseId), others, !isSelected);
}

/* ------------------------------ sanitising ------------------------------ */

/**
 * Removes anything from a selection that no longer fits (for example after
 * the customer changes skin type or base) and reports what was removed.
 * Earlier choices win over later ones.
 */
export function sanitize(input: Selection): { selection: Selection; removed: Removal[] } {
  const removed: Removal[] = [];
  const sel: Selection = {
    productType: input.productType,
    skinType: input.skinType,
    baseId: input.baseId,
    activeIds: [],
    boosterIds: [],
  };

  let base = getBase(sel.baseId);
  if (base && base.productType !== sel.productType) {
    base = undefined;
    sel.baseId = null;
  }
  if (base) {
    const verdict = evaluateBase(base, sel);
    if (verdict.status === "blocked") {
      removed.push({ id: base.id, name: base.name, reason: verdict.reason ?? "" });
      base = undefined;
      sel.baseId = null;
    }
  } else {
    sel.baseId = null;
  }

  const kept: Addition[] = [];
  const seen = new Set<string>();
  const candidates = [...input.activeIds, ...input.boosterIds];
  for (const id of candidates) {
    const add = getAddition(id);
    if (!add || seen.has(id)) continue;
    seen.add(id);
    if (!base) {
      // Additions depend on the base; without one they are cleared quietly.
      continue;
    }
    const verdict = evaluateAgainst(add, sel, base, kept, true);
    if (verdict.status === "blocked") {
      removed.push({ id: add.id, name: add.name, reason: verdict.reason ?? "" });
    } else {
      kept.push(add);
      if (add.kind === "active") sel.activeIds.push(add.id);
      else sel.boosterIds.push(add.id);
    }
  }

  return { selection: sel, removed };
}

/** A formula can be purchased once it has a product type, skin type and base. */
export function isComplete(sel: Selection): boolean {
  return Boolean(sel.productType && sel.skinType && getBase(sel.baseId));
}

/** Cautions for everything in the formula, without duplicates. */
export function formulaCautions(sel: Selection): string[] {
  const out: string[] = [];
  for (const a of selectedAdditions(sel)) {
    for (const c of a.cautions) if (!out.includes(c)) out.push(c);
  }
  return out;
}

/** "Night use only" if any ingredient is night-only. */
export function formulaUsage(sel: Selection): "am-pm" | "pm" {
  return selectedAdditions(sel).some((a) => a.usage === "pm") ? "pm" : "am-pm";
}
