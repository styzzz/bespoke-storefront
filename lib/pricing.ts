/**
 * Pricing. All arithmetic is in whole cents.
 *
 * The price of a formula is the base plus each addition. Plan discounts are a
 * percentage off every delivery. When Shopify is connected, `LivePricing`
 * replaces the placeholder prices and discounts in the catalog.
 */

import { PLANS, getBase, getPlan } from "./catalog";
import type { PlanId, Selection } from "./catalog";
import { selectedAdditions } from "./rules";

/** Prices and plan discounts read from Shopify. */
export interface LivePricing {
  currency: string;
  /** Variant price in cents, keyed by SKU. */
  prices: Record<string, number>;
  /** Discount percentage per plan, for plans found in Shopify. */
  planDiscounts: Partial<Record<PlanId, number>>;
}

/**
 * What the builder needs from Shopify: prices, which plans can be bought,
 * and which catalog items have no purchasable variant.
 */
export interface LiveView {
  pricing: LivePricing;
  availablePlans: PlanId[];
  unavailableSkus: string[];
}

export interface PriceLine {
  id: string;
  sku: string;
  name: string;
  cents: number;
}

export interface Quote {
  currency: string;
  lines: PriceLine[];
  /** Full price of one month's supply. */
  subtotalCents: number;
  planId: PlanId;
  discountPct: number;
  /** What the customer pays for each delivery on the chosen plan. */
  perDeliveryCents: number;
  savingsPerDeliveryCents: number;
  deliveries: number;
}

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

function priceOf(sku: string, fallbackDollars: number, live?: LivePricing | null): number {
  const livePrice = live?.prices[sku];
  return typeof livePrice === "number" ? livePrice : toCents(fallbackDollars);
}

export function planDiscount(planId: PlanId, live?: LivePricing | null): number {
  const fromShopify = live?.planDiscounts[planId];
  return typeof fromShopify === "number" ? fromShopify : getPlan(planId).discountPct;
}

export function quote(sel: Selection, planId: PlanId, live?: LivePricing | null): Quote {
  const lines: PriceLine[] = [];
  const base = getBase(sel.baseId);
  if (base) {
    lines.push({ id: base.id, sku: base.sku, name: base.name, cents: priceOf(base.sku, base.price, live) });
  }
  for (const a of selectedAdditions(sel)) {
    lines.push({ id: a.id, sku: a.sku, name: a.name, cents: priceOf(a.sku, a.price, live) });
  }
  const subtotalCents = lines.reduce((sum, l) => sum + l.cents, 0);
  const discountPct = planDiscount(planId, live);
  const perDeliveryCents = Math.round((subtotalCents * (100 - discountPct)) / 100);
  return {
    currency: live?.currency ?? "USD",
    lines,
    subtotalCents,
    planId,
    discountPct,
    perDeliveryCents,
    savingsPerDeliveryCents: subtotalCents - perDeliveryCents,
    deliveries: getPlan(planId).deliveries,
  };
}

/** Price of a single catalog item, for showing "+$6" next to an option. */
export function itemCents(sku: string, fallbackDollars: number, live?: LivePricing | null): number {
  return priceOf(sku, fallbackDollars, live);
}

export function formatMoney(cents: number, currency = "USD"): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export const PLAN_IDS: PlanId[] = PLANS.map((p) => p.id);
