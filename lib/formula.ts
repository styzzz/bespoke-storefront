/**
 * Turning a selection into things the lab and the order need:
 * a short formula code and a readable one-line description.
 */

import { PRODUCT_TYPES, getBase, getSkin } from "./catalog";
import type { Selection } from "./catalog";
import { formatPh, formulaPh, selectedAdditions } from "./rules";

/**
 * A compact code the lab can read off an order, e.g.
 * "SER-ALOE/OILY/HA+NIA+GT/COL+PSC". Built from catalog ids, so it changes
 * only if ids change.
 */
export function formulaCode(sel: Selection): string {
  const base = getBase(sel.baseId);
  if (!base) return "";
  const actives = sel.activeIds.map((id) => id.toUpperCase()).join("+") || "NONE";
  const boosters = sel.boosterIds.map((id) => id.toUpperCase()).join("+") || "NONE";
  return [base.id.toUpperCase(), (sel.skinType ?? "").toUpperCase(), actives, boosters].join("/");
}

export function productName(sel: Selection): string {
  const type = PRODUCT_TYPES.find((p) => p.id === sel.productType);
  return type ? `Bespoke ${type.name}` : "Bespoke formula";
}

/** e.g. "Aloe Water-Gel with Hyaluronic Acid 1%, Niacinamide 5% and Collagen Peptides 2%". */
export function formulaSummary(sel: Selection): string {
  const base = getBase(sel.baseId);
  if (!base) return "";
  const parts = selectedAdditions(sel).map((a) => `${a.name} ${a.dose}`);
  if (parts.length === 0) return base.name;
  const last = parts.pop();
  return parts.length ? `${base.name} with ${parts.join(", ")} and ${last}` : `${base.name} with ${last}`;
}

/** Key/value details attached to the order so the lab can make the batch. */
export function labSheet(sel: Selection): { key: string; value: string }[] {
  const base = getBase(sel.baseId);
  if (!base) return [];
  const additions = selectedAdditions(sel);
  const ph = formulaPh(base, additions);
  const rows = [
    { key: "Formula", value: formulaSummary(sel) },
    { key: "Skin type", value: getSkin(sel.skinType)?.name ?? "" },
    { key: "Size", value: `${base.sizeMl} ml` },
  ];
  if (ph) rows.push({ key: "Target pH", value: formatPh(ph) });
  return rows;
}
