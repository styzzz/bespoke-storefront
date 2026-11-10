/**
 * Shopify Storefront API client (server-side only).
 *
 * The storefront never invents prices or products. Each base, active and
 * booster is a product variant in Shopify, matched to the catalog by SKU.
 * A custom formula becomes one cart with a line per component, and the
 * customer pays through Shopify's own checkout.
 *
 * Without the environment variables below the site runs in demo mode:
 * everything works except the final hand-off to checkout.
 */

import { PLANS, getBase } from "./catalog";
import type { PlanId, Selection } from "./catalog";
import { formulaCode, labSheet, productName } from "./formula";
import type { LiveView } from "./pricing";
import { selectedAdditions } from "./rules";

/** Handles of the four Shopify products that hold the component variants. */
export const PRODUCT_HANDLES = {
  serumBases: "bespoke-serum",
  moisturizerBases: "bespoke-moisturizer",
  actives: "bespoke-actives",
  boosters: "bespoke-boosters",
} as const;

const API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-10";

interface ShopifyConfig {
  domain: string;
  headers: Record<string, string>;
}

function readConfig(): ShopifyConfig | null {
  const domain = (process.env.SHOPIFY_STORE_DOMAIN || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  const publicToken = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
  if (!domain || (!privateToken && !publicToken)) return null;
  const headers: Record<string, string> = privateToken
    ? { "Shopify-Storefront-Private-Token": privateToken }
    : { "X-Shopify-Storefront-Access-Token": publicToken as string };
  return { domain, headers };
}

export function shopifyConfigured(): boolean {
  return readConfig() !== null;
}

/** An error whose message is safe to show to a customer. */
export class StorefrontError extends Error {
  /** Technical detail for server logs. Never sent to the browser. */
  readonly detail?: string;

  constructor(message: string, detail?: string) {
    super(message);
    this.name = "StorefrontError";
    this.detail = detail;
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function storefront<T>(
  query: string,
  variables: Record<string, unknown>,
  options: { buyerIp?: string; revalidateSeconds?: number } = {},
): Promise<T> {
  const config = readConfig();
  if (!config) throw new StorefrontError("The store is not connected yet.");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...config.headers,
  };
  if (options.buyerIp && headers["Shopify-Storefront-Private-Token"]) {
    headers["Shopify-Storefront-Buyer-IP"] = options.buyerIp;
  }

  const init = {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
    ...(options.revalidateSeconds
      ? { next: { revalidate: options.revalidateSeconds } }
      : { cache: "no-store" }),
  } as RequestInit;

  let response: Response;
  try {
    response = await fetch(`https://${config.domain}/api/${API_VERSION}/graphql.json`, init);
  } catch (error) {
    throw new StorefrontError("We couldn't reach the store. Try again in a moment.", String(error));
  }
  if (!response.ok) {
    throw new StorefrontError(
      "We couldn't reach the store. Try again in a moment.",
      `Storefront API responded ${response.status}`,
    );
  }
  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors?.length || !json.data) {
    throw new StorefrontError(
      "The store returned an error. Try again in a moment.",
      json.errors?.map((e) => e.message).join("; "),
    );
  }
  return json.data;
}

/* ------------------------------ catalog ------------------------------ */

const CATALOG_QUERY = /* GraphQL */ `
  fragment BespokeProduct on Product {
    handle
    variants(first: 100) {
      nodes {
        id
        sku
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }
    sellingPlanGroups(first: 10) {
      nodes {
        sellingPlans(first: 20) {
          nodes {
            id
            name
            priceAdjustments {
              adjustmentValue {
                __typename
                ... on SellingPlanPercentagePriceAdjustment {
                  adjustmentPercentage
                }
              }
            }
          }
        }
      }
    }
  }

  query BespokeCatalog($serum: String!, $moisturizer: String!, $actives: String!, $boosters: String!) {
    serum: product(handle: $serum) {
      ...BespokeProduct
    }
    moisturizer: product(handle: $moisturizer) {
      ...BespokeProduct
    }
    actives: product(handle: $actives) {
      ...BespokeProduct
    }
    boosters: product(handle: $boosters) {
      ...BespokeProduct
    }
  }
`;

interface ProductNode {
  handle: string;
  variants: {
    nodes: {
      id: string;
      sku: string | null;
      availableForSale: boolean;
      price: { amount: string; currencyCode: string };
    }[];
  };
  sellingPlanGroups: {
    nodes: {
      sellingPlans: {
        nodes: {
          id: string;
          name: string;
          priceAdjustments: {
            adjustmentValue: { __typename: string; adjustmentPercentage?: number };
          }[];
        }[];
      };
    }[];
  };
}

type CatalogData = Record<"serum" | "moisturizer" | "actives" | "boosters", ProductNode | null>;

export interface LiveVariant {
  id: string;
  cents: number;
  available: boolean;
  productHandle: string;
}

export interface LivePlan {
  sellingPlanId: string;
  discountPct: number;
}

export interface LiveCatalog {
  currency: string;
  /** Keyed by SKU. */
  variants: Record<string, LiveVariant>;
  /** Selling plans per product handle. */
  plansByProduct: Record<string, Partial<Record<PlanId, LivePlan>>>;
  /** Products that could not be found in Shopify. */
  missingProducts: string[];
}

function matchPlan(name: string): PlanId | null {
  const lower = name.toLowerCase();
  for (const plan of PLANS) {
    if (plan.shopifyNameIncludes.length === 0) continue;
    if (plan.shopifyNameIncludes.every((word) => lower.includes(word))) return plan.id;
  }
  return null;
}

export async function fetchLiveCatalog(options: { fresh?: boolean } = {}): Promise<LiveCatalog> {
  const data = await storefront<CatalogData>(
    CATALOG_QUERY,
    {
      serum: PRODUCT_HANDLES.serumBases,
      moisturizer: PRODUCT_HANDLES.moisturizerBases,
      actives: PRODUCT_HANDLES.actives,
      boosters: PRODUCT_HANDLES.boosters,
    },
    options.fresh ? {} : { revalidateSeconds: 300 },
  );

  const live: LiveCatalog = { currency: "USD", variants: {}, plansByProduct: {}, missingProducts: [] };
  const expected: [keyof CatalogData, string][] = [
    ["serum", PRODUCT_HANDLES.serumBases],
    ["moisturizer", PRODUCT_HANDLES.moisturizerBases],
    ["actives", PRODUCT_HANDLES.actives],
    ["boosters", PRODUCT_HANDLES.boosters],
  ];

  for (const [key, handle] of expected) {
    const product = data[key];
    if (!product) {
      live.missingProducts.push(handle);
      continue;
    }
    for (const variant of product.variants.nodes) {
      if (!variant.sku) continue;
      live.currency = variant.price.currencyCode;
      live.variants[variant.sku] = {
        id: variant.id,
        cents: Math.round(parseFloat(variant.price.amount) * 100),
        available: variant.availableForSale,
        productHandle: handle,
      };
    }
    const plans: Partial<Record<PlanId, LivePlan>> = {};
    for (const group of product.sellingPlanGroups.nodes) {
      for (const plan of group.sellingPlans.nodes) {
        const planId = matchPlan(plan.name);
        const adjustment = plan.priceAdjustments[0]?.adjustmentValue;
        // Only percentage discounts are supported, so the price shown here
        // always matches the price charged at checkout.
        if (!planId || !adjustment || typeof adjustment.adjustmentPercentage !== "number") continue;
        plans[planId] = { sellingPlanId: plan.id, discountPct: adjustment.adjustmentPercentage };
      }
    }
    live.plansByProduct[handle] = plans;
  }
  return live;
}

export function toLiveView(live: LiveCatalog, allSkus: string[]): LiveView {
  const prices: Record<string, number> = {};
  for (const [sku, v] of Object.entries(live.variants)) prices[sku] = v.cents;

  const handles = Object.values(PRODUCT_HANDLES);
  const planDiscounts: Partial<Record<PlanId, number>> = {};
  const availablePlans: PlanId[] = ["once"];
  for (const plan of PLANS) {
    if (plan.id === "once") continue;
    const perProduct = handles.map((h) => live.plansByProduct[h]?.[plan.id]);
    const first = perProduct[0];
    // A plan is offered only if every product has it at the same discount.
    if (first && perProduct.every((p) => p && p.discountPct === first.discountPct)) {
      planDiscounts[plan.id] = first.discountPct;
      availablePlans.push(plan.id);
    }
  }

  const unavailableSkus = allSkus.filter((sku) => !live.variants[sku] || !live.variants[sku].available);
  return { pricing: { currency: live.currency, prices, planDiscounts }, availablePlans, unavailableSkus };
}

/* ------------------------------ checkout ------------------------------ */

const CART_CREATE = /* GraphQL */ `
  mutation BespokeCartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface CartCreateData {
  cartCreate: {
    cart: { id: string; checkoutUrl: string } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
}

interface CartLine {
  merchandiseId: string;
  quantity: number;
  sellingPlanId?: string;
  attributes: { key: string; value: string }[];
}

/**
 * Builds the cart for a validated formula and returns Shopify's checkout URL.
 * The selection must already have been through `sanitize`.
 */
export async function createCheckout(
  sel: Selection,
  planId: PlanId,
  options: { buyerIp?: string } = {},
): Promise<string> {
  const base = getBase(sel.baseId);
  if (!base) throw new StorefrontError("Choose a base before checking out.");

  const live = await fetchLiveCatalog({ fresh: true });
  const code = formulaCode(sel);
  // Ties the lines of one formula together on the order.
  const batch = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
  const title = productName(sel);

  const components = [
    { sku: base.sku, name: base.name, isBase: true },
    ...selectedAdditions(sel).map((a) => ({ sku: a.sku, name: `${a.name} ${a.dose}`, isBase: false })),
  ];

  const lines: CartLine[] = components.map((component) => {
    const variant = live.variants[component.sku];
    if (!variant || !variant.available) {
      throw new StorefrontError(
        `${component.name} isn't available right now. Remove it or try again later.`,
        `No purchasable Shopify variant with SKU ${component.sku}`,
      );
    }
    const line: CartLine = {
      merchandiseId: variant.id,
      quantity: 1,
      attributes: component.isBase
        ? [...labSheet(sel), { key: "_bespoke_code", value: code }, { key: "_bespoke_batch", value: batch }]
        : [
            { key: "Added to", value: title },
            { key: "_bespoke_code", value: code },
            { key: "_bespoke_batch", value: batch },
          ],
    };
    if (planId !== "once") {
      const plan = live.plansByProduct[variant.productHandle]?.[planId];
      if (!plan) {
        throw new StorefrontError(
          "That plan isn't available right now. Choose a one-time purchase or try again later.",
          `Selling plan "${planId}" is not attached to product ${variant.productHandle}`,
        );
      }
      line.sellingPlanId = plan.sellingPlanId;
    }
    return line;
  });

  const data = await storefront<CartCreateData>(
    CART_CREATE,
    {
      input: {
        lines,
        attributes: [
          { key: "Bespoke formula", value: code },
          { key: "Bespoke batch", value: batch },
        ],
        note: `Bespoke formula ${code} (batch ${batch}): ${labSheet(sel)
          .map((row) => `${row.key}: ${row.value}`)
          .join(" | ")}`,
      },
    },
    { buyerIp: options.buyerIp },
  );

  const { cart, userErrors } = data.cartCreate;
  if (userErrors.length || !cart) {
    throw new StorefrontError(
      "We couldn't start checkout. Try again in a moment.",
      userErrors.map((e) => e.message).join("; "),
    );
  }
  return cart.checkoutUrl;
}
