import { ACTIVES, BASES, BOOSTERS, PLANS, SKIN_TYPES } from "./data";
import type { Addition, Base, Plan, PlanId, ProductType, SkinProfile, SkinType } from "./types";

export * from "./data";
export * from "./types";

export const ADDITIONS: Addition[] = [...ACTIVES, ...BOOSTERS];

const baseById = new Map(BASES.map((b) => [b.id, b]));
const additionById = new Map(ADDITIONS.map((a) => [a.id, a]));
const planById = new Map(PLANS.map((p) => [p.id, p]));
const skinById = new Map(SKIN_TYPES.map((s) => [s.id, s]));

export function getBase(id: string | null | undefined): Base | undefined {
  return id ? baseById.get(id) : undefined;
}

export function getAddition(id: string): Addition | undefined {
  return additionById.get(id);
}

export function getPlan(id: PlanId): Plan {
  return planById.get(id) ?? PLANS[0];
}

export function getSkin(id: SkinType | null | undefined): SkinProfile | undefined {
  return id ? skinById.get(id) : undefined;
}

export function basesFor(productType: ProductType): Base[] {
  return BASES.filter((b) => b.productType === productType);
}

export const PRODUCT_TYPES: { id: ProductType; name: string; description: string; size: string }[] = [
  {
    id: "serum",
    name: "Serum",
    description: "A concentrated treatment layer, applied before moisturizer.",
    size: "30 ml",
  },
  {
    id: "moisturizer",
    name: "Moisturizer",
    description: "Your daily cream or lotion, applied last to hydrate and seal.",
    size: "50 ml",
  },
];
