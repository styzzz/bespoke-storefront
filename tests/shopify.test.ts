/**
 * Tests the Shopify integration against a stand-in for the Storefront API.
 * They check what this site sends and how it reads the replies. They do not
 * prove the real API accepts the queries: that needs a test order on the
 * live store (see docs/SETUP.md).
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { ACTIVES, ADDITIONS, BASES, BOOSTERS, basesFor } from "../lib/catalog";
import type { Selection } from "../lib/catalog";
import { quote } from "../lib/pricing";
import {
  PRODUCT_HANDLES,
  StorefrontError,
  createCheckout,
  fetchLiveCatalog,
  shopifyConfigured,
  toLiveView,
} from "../lib/shopify";

const ALL_SKUS = [...BASES, ...ADDITIONS].map((x) => x.sku);

const formula: Selection = {
  productType: "serum",
  skinType: "oily",
  baseId: "ser-aloe",
  activeIds: ["ha", "nia"],
  boosterIds: ["col"],
};

interface Call {
  url: string;
  headers: Record<string, string>;
  body: { query: string; variables: Record<string, unknown> };
}

interface FakeOptions {
  /** Product handle that has no selling plans attached. */
  noPlansOn?: string;
  /** SKU missing from Shopify. */
  missingSku?: string;
  /** cartCreate replies with this user error. */
  cartError?: string;
  /** Add $1 to every Shopify price, to prove live prices are used. */
  markup?: boolean;
}

function product(
  handle: string,
  items: { sku: string; price: number }[],
  options: FakeOptions,
) {
  const plans =
    options.noPlansOn === handle
      ? []
      : [
          { id: "gid://shopify/SellingPlan/3", name: "Bespoke 3-Month Plan", pct: 10 },
          { id: "gid://shopify/SellingPlan/12", name: "Bespoke Annual Plan", pct: 20 },
          { id: "gid://shopify/SellingPlan/99", name: "Some other plan", pct: 5 },
        ];
  return {
    handle,
    variants: {
      nodes: items
        .filter((i) => i.sku !== options.missingSku)
        .map((i) => ({
          id: `gid://shopify/ProductVariant/${i.sku}`,
          sku: i.sku,
          availableForSale: true,
          price: { amount: (i.price + (options.markup ? 1 : 0)).toFixed(1), currencyCode: "USD" },
        })),
    },
    sellingPlanGroups: {
      nodes: [
        {
          sellingPlans: {
            nodes: plans.map((p) => ({
              id: p.id,
              name: p.name,
              priceAdjustments: [
                {
                  adjustmentValue: {
                    __typename: "SellingPlanPercentagePriceAdjustment",
                    adjustmentPercentage: p.pct,
                  },
                },
              ],
            })),
          },
        },
      ],
    },
  };
}

function installFakeShopify(options: FakeOptions = {}): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = {
      url: String(input),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body)),
    };
    calls.push(call);
    let data: unknown;
    if (call.body.query.includes("BespokeCatalog")) {
      data = {
        serum: product(PRODUCT_HANDLES.serumBases, basesFor("serum"), options),
        moisturizer: product(PRODUCT_HANDLES.moisturizerBases, basesFor("moisturizer"), options),
        actives: product(PRODUCT_HANDLES.actives, ACTIVES, options),
        boosters: product(PRODUCT_HANDLES.boosters, BOOSTERS, options),
      };
    } else {
      data = {
        cartCreate: options.cartError
          ? { cart: null, userErrors: [{ field: ["lines"], message: options.cartError }] }
          : {
              cart: { id: "gid://shopify/Cart/1", checkoutUrl: "https://www.madefromearth.com/cart/c/1" },
              userErrors: [],
            },
      };
    }
    return new Response(JSON.stringify({ data }), { status: 200 });
  }) as typeof fetch;
  return calls;
}

const realFetch = globalThis.fetch;

describe("Shopify integration", () => {
  beforeEach(() => {
    process.env.SHOPIFY_STORE_DOMAIN = "https://example.myshopify.com/";
    process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = "private-token";
    delete process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    delete process.env.SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
    delete process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
  });

  it("is off without credentials and on with them", () => {
    assert.equal(shopifyConfigured(), true);
    delete process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
    assert.equal(shopifyConfigured(), false);
    process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN = "public-token";
    assert.equal(shopifyConfigured(), true);
  });

  it("reads prices and plans, and uses live prices in the quote", async () => {
    const calls = installFakeShopify({ markup: true });
    const live = await fetchLiveCatalog({ fresh: true });
    const view = toLiveView(live, ALL_SKUS);

    assert.equal(calls[0].url, "https://example.myshopify.com/api/2026-10/graphql.json");
    assert.equal(calls[0].headers["Shopify-Storefront-Private-Token"], "private-token");
    assert.equal(Object.keys(live.variants).length, ALL_SKUS.length);
    assert.deepEqual(view.unavailableSkus, []);
    assert.deepEqual(view.availablePlans, ["once", "quarter", "annual"]);
    assert.deepEqual(view.pricing.planDiscounts, { quarter: 10, annual: 20 });

    // Catalog placeholders: 28 + 6 + 5 + 9 = 48. Shopify adds $1 to each of 4 items.
    const q = quote(formula, "annual", view.pricing);
    assert.equal(q.subtotalCents, 5200);
    assert.equal(q.perDeliveryCents, 4160);
  });

  it("uses the public token header when only a public token is set", async () => {
    delete process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
    process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN = "public-token";
    const calls = installFakeShopify();
    await fetchLiveCatalog({ fresh: true });
    assert.equal(calls[0].headers["X-Shopify-Storefront-Access-Token"], "public-token");
    assert.equal(calls[0].headers["Shopify-Storefront-Private-Token"], undefined);
  });

  it("builds a cart with one line per component, the plan on every line, and the formula attached", async () => {
    const calls = installFakeShopify();
    const url = await createCheckout(formula, "quarter", { buyerIp: "203.0.113.9" });
    assert.equal(url, "https://www.madefromearth.com/cart/c/1");

    const cartCall = calls[calls.length - 1];
    assert.equal(cartCall.headers["Shopify-Storefront-Buyer-IP"], "203.0.113.9");
    const input = cartCall.body.variables.input as {
      lines: { merchandiseId: string; quantity: number; sellingPlanId?: string; attributes: { key: string; value: string }[] }[];
      note: string;
    };
    assert.deepEqual(
      input.lines.map((l) => l.merchandiseId),
      ["BSP-BASE-SER-ALOE", "BSP-ACT-HA", "BSP-ACT-NIA", "BSP-BST-COL"].map((s) => `gid://shopify/ProductVariant/${s}`),
    );
    assert.ok(input.lines.every((l) => l.quantity === 1));
    assert.ok(input.lines.every((l) => l.sellingPlanId === "gid://shopify/SellingPlan/3"));

    const attr = (i: number, key: string) => input.lines[i].attributes.find((a) => a.key === key)?.value;
    assert.equal(attr(0, "Formula"), "Aloe Water-Gel with Hyaluronic Acid 1%, Niacinamide 5% and Collagen Peptides 2%");
    assert.equal(attr(0, "Skin type"), "Oily");
    assert.equal(attr(0, "_bespoke_code"), "SER-ALOE/OILY/HA+NIA/COL");
    assert.equal(attr(1, "Added to"), "Bespoke Serum");
    const batches = new Set(input.lines.map((l) => l.attributes.find((a) => a.key === "_bespoke_batch")?.value));
    assert.equal(batches.size, 1);
    assert.match(input.note, /SER-ALOE\/OILY\/HA\+NIA\/COL/);
  });

  it("sends no selling plan for a one-time purchase", async () => {
    const calls = installFakeShopify();
    await createCheckout(formula, "once");
    const input = calls[calls.length - 1].body.variables.input as { lines: { sellingPlanId?: string }[] };
    assert.ok(input.lines.every((l) => l.sellingPlanId === undefined));
  });

  it("hides a plan that is not attached to every product, and refuses to check out with it", async () => {
    installFakeShopify({ noPlansOn: PRODUCT_HANDLES.boosters });
    const view = toLiveView(await fetchLiveCatalog({ fresh: true }), ALL_SKUS);
    assert.deepEqual(view.availablePlans, ["once"]);
    await assert.rejects(() => createCheckout(formula, "annual"), StorefrontError);
  });

  it("marks a component with no Shopify variant as unavailable, and refuses to check out with it", async () => {
    installFakeShopify({ missingSku: "BSP-ACT-HA" });
    const view = toLiveView(await fetchLiveCatalog({ fresh: true }), ALL_SKUS);
    assert.deepEqual(view.unavailableSkus, ["BSP-ACT-HA"]);
    await assert.rejects(() => createCheckout(formula, "once"), /Hyaluronic Acid 1% isn't available/);
  });

  it("turns a Shopify cart error into a customer-safe message", async () => {
    installFakeShopify({ cartError: "Merchandise is invalid" });
    await assert.rejects(
      () => createCheckout(formula, "once"),
      (error: unknown) =>
        error instanceof StorefrontError &&
        error.message === "We couldn't start checkout. Try again in a moment." &&
        error.detail === "Merchandise is invalid",
    );
  });
});
