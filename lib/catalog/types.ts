/**
 * Shared types for the bespoke formula catalog.
 *
 * Everything the storefront knows about bases, actives and boosters lives in
 * `lib/catalog/data.ts` and is typed here. The rules engine (`lib/rules.ts`)
 * reads only these fields, so changing the data changes the behaviour.
 */

export type ProductType = "serum" | "moisturizer";

export type SkinType = "normal" | "oily" | "dry" | "combination" | "sensitive";

/** The phase an ingredient dissolves in, or a phase a base can carry. */
export type Phase = "water" | "oil";

/**
 * Tags drive the skin-type and conflict rules.
 * - rich:             heavy butters / occlusive lipids
 * - exfoliant:        any exfoliating acid (one per formula)
 * - strong-exfoliant: acids too strong for sensitive skin
 * - oil-clearing:     dissolves sebum; drying on dry skin
 * - retinoid:         vitamin A derivatives
 */
export type Tag =
  | "rich"
  | "exfoliant"
  | "strong-exfoliant"
  | "oil-clearing"
  | "retinoid";

/** How well the stated effect is supported by published human studies. */
export type Evidence = "strong" | "moderate" | "limited";

/** The pH range in which an ingredient or base stays stable and effective. */
export interface PhWindow {
  min: number;
  max: number;
}

export interface Base {
  kind: "base";
  id: string;
  /** Must match the variant SKU in Shopify. */
  sku: string;
  productType: ProductType;
  name: string;
  /** One or two sentences shown to the customer. */
  summary: string;
  /** Main ingredients, INCI-style. */
  keyIngredients: string;
  /** Which ingredient phases this base can carry. */
  phases: Phase[];
  /** pH range the base can be adjusted to. null = no water, so no pH. */
  ph: PhWindow | null;
  tags: Tag[];
  bestFor: SkinType[];
  /** USD. Placeholder until Shopify prices are live. */
  price: number;
  sizeMl: number;
  /** Colour of this layer in the formula column. */
  color: string;
  /** Formulation notes for the lab and the knowledge base. */
  science: string;
}

export type ActiveGroup = "hydrate" | "brighten" | "resurface" | "renew" | "soothe";

export interface Addition {
  kind: "active" | "booster";
  id: string;
  /** Must match the variant SKU in Shopify. */
  sku: string;
  /** Only used for actives, to group them in the builder. */
  group?: ActiveGroup;
  name: string;
  inci: string;
  /** Use level shown to the customer, e.g. "5%". */
  dose: string;
  phase: Phase;
  /** pH range needed in a water-containing formula. */
  ph: PhWindow;
  tags: Tag[];
  bestFor: SkinType[];
  usage: "am-pm" | "pm";
  /** What the customer can expect, in plain language. */
  effect: string;
  /** How it works and what it does not do. */
  science: string;
  evidence: Evidence;
  evidenceNote: string;
  /** Warnings shown once the ingredient is in the formula. */
  cautions: string[];
  /** Notes for the owner / formulating chemist. Not shown to customers. */
  labNotes?: string;
  /** USD. Placeholder until Shopify prices are live. */
  price: number;
  color: string;
}

export interface SkinProfile {
  id: SkinType;
  name: string;
  description: string;
}

export interface SkinBlock {
  tag: Tag;
  /** Limit the rule to one product type. Omit to apply to both. */
  productType?: ProductType;
  reason: string;
}

export interface PairConflict {
  a: Tag;
  b: Tag;
  reason: string;
}

export type PlanId = "once" | "quarter" | "annual";

export interface Plan {
  id: PlanId;
  name: string;
  /** Short line under the plan name. */
  detail: string;
  /** Percentage off each delivery. Placeholder until Shopify plans are live. */
  discountPct: number;
  /** Number of monthly deliveries. 1 = one-time purchase. */
  deliveries: number;
  /**
   * Lower-case words that must all appear in the Shopify selling plan name
   * for the storefront to link this plan to it.
   */
  shopifyNameIncludes: string[];
}

export interface Selection {
  productType: ProductType | null;
  skinType: SkinType | null;
  baseId: string | null;
  activeIds: string[];
  boosterIds: string[];
}
