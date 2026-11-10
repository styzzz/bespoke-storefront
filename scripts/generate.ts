/**
 * Regenerates the files that are derived from the catalog:
 *
 *   docs/INGREDIENTS.md           the ingredient knowledge base
 *   shopify/products-import.csv   the products to import into Shopify
 *
 * Run `npm run generate` after editing lib/catalog/data.ts.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACTIVES,
  ACTIVE_GROUPS,
  ADDITIONS,
  BASES,
  BOOSTERS,
  MAX_ACTIVES,
  MIN_PH_OVERLAP,
  PAIR_CONFLICTS,
  PLANS,
  PRODUCT_TYPES,
  SKIN_BLOCKS,
  SKIN_TYPES,
  basesFor,
  getSkin,
} from "../lib/catalog";
import type { Addition, Base, Selection, SkinType } from "../lib/catalog";
import { evaluateAddition, evaluateBase, formatPh } from "../lib/rules";
import { PRODUCT_HANDLES } from "../lib/shopify";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const EVIDENCE = { strong: "Well established", moderate: "Good evidence", limited: "Early evidence" };
const skins = (ids: SkinType[]) =>
  ids.length === SKIN_TYPES.length ? "All skin types" : ids.map((id) => getSkin(id)?.name ?? id).join(", ");
const sel = (partial: Partial<Selection>): Selection => ({
  productType: null,
  skinType: null,
  baseId: null,
  activeIds: [],
  boosterIds: [],
  ...partial,
});

/* ------------------------------ INGREDIENTS.md ------------------------------ */

function baseSection(b: Base): string {
  return [
    `#### ${b.name}`,
    "",
    `- **SKU:** \`${b.sku}\``,
    `- **Key ingredients:** ${b.keyIngredients}`,
    `- **What the customer is told:** ${b.summary}`,
    `- **Formulation:** ${b.science}`,
    `- **Carries:** ${b.phases.map((p) => `${p}-soluble`).join(" and ")} ingredients`,
    `- **pH:** ${b.ph ? formatPh(b.ph) : "none (contains no water)"}`,
    `- **Best for:** ${skins(b.bestFor)}`,
    `- **Size / placeholder price:** ${b.sizeMl} ml / $${b.price}`,
    b.tags.length ? `- **Rule tags:** ${b.tags.join(", ")}` : "",
    "",
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
}

function additionSection(a: Addition): string {
  const lines = [
    `#### ${a.name} (${a.dose})`,
    "",
    `- **SKU:** \`${a.sku}\``,
    `- **INCI:** ${a.inci}`,
    `- **Effect (shown to the customer):** ${a.effect}`,
    `- **How it works:** ${a.science}`,
    `- **Evidence:** ${EVIDENCE[a.evidence]}. ${a.evidenceNote}`,
    `- **Dissolves in:** ${a.phase}`,
    `- **Works at pH:** ${formatPh(a.ph)}`,
    `- **Best for:** ${skins(a.bestFor)}`,
    `- **Use:** ${a.usage === "pm" ? "at night only" : "morning and night"}`,
  ];
  if (a.cautions.length) lines.push(`- **Customer cautions:** ${a.cautions.join(" ")}`);
  if (a.labNotes) lines.push(`- **Lab notes (not shown to customers):** ${a.labNotes}`);
  if (a.tags.length) lines.push(`- **Rule tags:** ${a.tags.join(", ")}`);
  lines.push(`- **Placeholder price:** $${a.price}`, "");
  return lines.join("\n");
}

/** Short cause of a block, for the matrix cells. */
function cause(reason: string | undefined): string {
  if (!reason) return "no";
  if (reason.includes("oil-soluble") || reason.includes("water-soluble")) return "no: solubility";
  if (reason.includes("pH")) return "no: pH";
  if (reason.includes("exfoliating acid per formula")) return "no: one acid";
  if (reason.includes("Retinol and an exfoliating")) return "no: retinol + acid";
  return "no: skin type";
}

function baseMatrix(): string {
  const header = `| Ingredient | ${BASES.map((b) => b.name).join(" | ")} |`;
  const rule = `|---|${BASES.map(() => "---").join("|")}|`;
  const rows = ADDITIONS.map((a) => {
    const cells = BASES.map((b) => {
      const v = evaluateAddition(a, sel({ productType: b.productType, skinType: "normal", baseId: b.id }));
      return v.status === "blocked" ? cause(v.reason) : "yes";
    });
    return `| ${a.name} | ${cells.join(" | ")} |`;
  });
  return [header, rule, ...rows].join("\n");
}

function pairMatrix(): string {
  // Tested in the most flexible base so only ingredient-to-ingredient rules show.
  const base = BASES.find((b) => b.id === "ser-milk") ?? BASES[0];
  const header = `| | ${ADDITIONS.map((a) => a.name).join(" | ")} |`;
  const rule = `|---|${ADDITIONS.map(() => "---").join("|")}|`;
  const rows = ADDITIONS.map((a) => {
    const cells = ADDITIONS.map((b) => {
      if (a.id === b.id) return "";
      const state = sel({
        productType: base.productType,
        skinType: "normal",
        baseId: base.id,
        activeIds: a.kind === "active" ? [a.id] : [],
        boosterIds: a.kind === "booster" ? [a.id] : [],
      });
      const v = evaluateAddition(b, state);
      return v.status === "blocked" ? cause(v.reason) : "yes";
    });
    return `| **${a.name}** | ${cells.join(" | ")} |`;
  });
  return [header, rule, ...rows].join("\n");
}

function skinMatrix(): string {
  const items: (Base | Addition)[] = [...BASES, ...ADDITIONS];
  const header = `| | ${SKIN_TYPES.map((s) => s.name).join(" | ")} |`;
  const rule = `|---|${SKIN_TYPES.map(() => "---").join("|")}|`;
  const rows = items.map((item) => {
    const cells = SKIN_TYPES.map((s) => {
      const blocked =
        item.kind === "base"
          ? evaluateBase(item, sel({ productType: item.productType, skinType: s.id })).status === "blocked"
          : SKIN_BLOCKS[s.id].some((r) => item.tags.includes(r.tag));
      if (blocked) return "greyed out";
      return item.bestFor.includes(s.id) ? "recommended" : "available";
    });
    return `| ${item.name} | ${cells.join(" | ")} |`;
  });
  return [header, rule, ...rows].join("\n");
}

function ingredientsDoc(): string {
  const out: string[] = [];
  out.push(
    "# Bespoke ingredient knowledge base",
    "",
    "> Generated from `lib/catalog/data.ts` by `npm run generate`. Edit the data file, not this document.",
    "",
    "This is the background knowledge behind the builder: every base and ingredient, what it does, where it can be added, and why some combinations are blocked. The website reads the same data, so this document always matches what customers see.",
    "",
    "**Before launch:** this was written from published cosmetic science, not from your lab's own formulas or stability tests. Have your formulating chemist confirm every concentration, pH range and rule, and replace the placeholder prices.",
    "",
    "## How the builder decides what to grey out",
    "",
    "1. **Solubility.** Every ingredient dissolves in water or in oil. A base lists which of the two it can carry. An oil-soluble ingredient is blocked in a base with no oil, and a water-soluble one in a base with no water.",
    `2. **pH.** Every ingredient in a water-containing formula shares one pH. Each base and ingredient has a pH range. An ingredient is blocked unless its range overlaps the base and everything already chosen by at least ${MIN_PH_OVERLAP} pH units.`,
    "3. **Pairs that never share a bottle.**",
    ...PAIR_CONFLICTS.map((c) => `   - ${c.a} with ${c.b}: ${c.reason}`),
    "4. **Skin type.** Items carrying certain tags are blocked for certain skin types:",
    ...SKIN_TYPES.flatMap((s) => SKIN_BLOCKS[s.id].map((r) => `   - ${s.name} skin blocks \`${r.tag}\`: ${r.reason}`)),
    `5. **Room in the bottle.** Up to ${MAX_ACTIVES} actives, plus collagen peptides, plant stem cells or both.`,
    "",
    "The customer always sees the specific reason next to a greyed-out option. If an earlier choice stops fitting after a change (for example a new skin type), it is removed and the customer is told why.",
    "",
    "## Skin types",
    "",
    ...SKIN_TYPES.map((s) => `- **${s.name}:** ${s.description}`),
    "",
    "## Bases",
    "",
  );
  for (const type of PRODUCT_TYPES) {
    out.push(`### ${type.name} bases (${type.size})`, "");
    for (const b of basesFor(type.id)) out.push(baseSection(b));
  }
  out.push("## Actives", "");
  for (const group of ACTIVE_GROUPS) {
    out.push(`### ${group.name}`, "", group.description, "");
    for (const a of ACTIVES.filter((x) => x.group === group.id)) out.push(additionSection(a));
  }
  out.push("## Boosters", "");
  for (const a of BOOSTERS) out.push(additionSection(a));
  out.push(
    "## Where each ingredient can be added",
    "",
    "Checked for balanced skin, so only base rules show.",
    "",
    baseMatrix(),
    "",
    "## Which ingredients can be combined",
    "",
    "Read across: with the ingredient in the row already chosen, can the ingredient in the column be added? Checked in Jojoba Milk Serum, the most flexible base.",
    "",
    pairMatrix(),
    "",
    "## Skin type suitability",
    "",
    skinMatrix(),
    "",
    "## Plans",
    "",
    "| Plan | Deliveries | Placeholder discount |",
    "|---|---|---|",
    ...PLANS.map((p) => `| ${p.name} | ${p.deliveries} | ${p.discountPct}% |`),
    "",
  );
  return out.join("\n");
}

/* ------------------------------ Shopify CSV ------------------------------ */

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function shopifyCsv(): string {
  const columns = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Variant SKU",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Status",
  ];
  const products: {
    handle: string;
    title: string;
    body: string;
    option: string;
    variants: { value: string; sku: string; price: number }[];
  }[] = [
    {
      handle: PRODUCT_HANDLES.serumBases,
      title: "Bespoke Serum",
      body: "A serum made to order from the customer's own formula. 30 ml, a one-month supply.",
      option: "Base",
      variants: basesFor("serum").map((b) => ({ value: b.name, sku: b.sku, price: b.price })),
    },
    {
      handle: PRODUCT_HANDLES.moisturizerBases,
      title: "Bespoke Moisturizer",
      body: "A moisturizer made to order from the customer's own formula. 50 ml, a one-month supply.",
      option: "Base",
      variants: basesFor("moisturizer").map((b) => ({ value: b.name, sku: b.sku, price: b.price })),
    },
    {
      handle: PRODUCT_HANDLES.actives,
      title: "Bespoke Active",
      body: "An active ingredient added to a bespoke formula. Not sold separately.",
      option: "Active",
      variants: ACTIVES.map((a) => ({ value: `${a.name} ${a.dose}`, sku: a.sku, price: a.price })),
    },
    {
      handle: PRODUCT_HANDLES.boosters,
      title: "Bespoke Booster",
      body: "A booster added to a bespoke formula. Not sold separately.",
      option: "Booster",
      variants: BOOSTERS.map((a) => ({ value: `${a.name} ${a.dose}`, sku: a.sku, price: a.price })),
    },
  ];

  const rows: string[][] = [columns];
  for (const p of products) {
    p.variants.forEach((v, i) => {
      const first = i === 0;
      rows.push([
        p.handle,
        first ? p.title : "",
        first ? `<p>${p.body}</p>` : "",
        first ? "Made from Earth" : "",
        first ? "Bespoke" : "",
        first ? "bespoke" : "",
        first ? "FALSE" : "",
        first ? p.option : "",
        v.value,
        v.sku,
        "continue",
        "manual",
        v.price.toFixed(2),
        "TRUE",
        "TRUE",
        first ? "active" : "",
      ]);
    });
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

/* ------------------------------ write ------------------------------ */

function write(path: string, content: string) {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  console.log(`wrote ${path} (${content.length.toLocaleString()} characters)`);
}

write("docs/INGREDIENTS.md", ingredientsDoc());
write("shopify/products-import.csv", shopifyCsv());
