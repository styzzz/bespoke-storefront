/**
 * POST /api/checkout
 *
 * Takes the customer's formula and plan, re-checks the formula against the
 * compatibility rules on the server (the browser is never trusted), then
 * builds a Shopify cart and returns the checkout URL.
 */

import { PLANS } from "@/lib/catalog";
import type { PlanId, ProductType, Selection, SkinType } from "@/lib/catalog";
import { isComplete, sanitize } from "@/lib/rules";
import { StorefrontError, createCheckout, shopifyConfigured } from "@/lib/shopify";

const PRODUCT_TYPES: ProductType[] = ["serum", "moisturizer"];
const SKIN_TYPES: SkinType[] = ["normal", "oily", "dry", "combination", "sensitive"];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 20 && value.every((v) => typeof v === "string" && v.length <= 40);
}

function parse(body: unknown): { selection: Selection; planId: PlanId } | null {
  if (!body || typeof body !== "object") return null;
  const { selection, planId } = body as { selection?: unknown; planId?: unknown };
  if (!selection || typeof selection !== "object") return null;
  const s = selection as Record<string, unknown>;
  if (!PRODUCT_TYPES.includes(s.productType as ProductType)) return null;
  if (!SKIN_TYPES.includes(s.skinType as SkinType)) return null;
  if (typeof s.baseId !== "string" || s.baseId.length > 40) return null;
  if (!isStringArray(s.activeIds) || !isStringArray(s.boosterIds)) return null;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  return {
    selection: {
      productType: s.productType as ProductType,
      skinType: s.skinType as SkinType,
      baseId: s.baseId,
      activeIds: s.activeIds,
      boosterIds: s.boosterIds,
    },
    planId: plan.id,
  };
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request could not be read." }, { status: 400 });
  }

  const parsed = parse(body);
  if (!parsed) {
    return Response.json({ error: "That formula is incomplete. Go back and finish each step." }, { status: 400 });
  }

  const { selection, removed } = sanitize(parsed.selection);
  const unchanged =
    removed.length === 0 &&
    selection.baseId === parsed.selection.baseId &&
    sameIds(selection.activeIds, parsed.selection.activeIds) &&
    sameIds(selection.boosterIds, parsed.selection.boosterIds);
  if (!unchanged || !isComplete(selection)) {
    return Response.json(
      { error: "Some of these ingredients can't be combined. Reload the page and rebuild your formula." },
      { status: 422 },
    );
  }

  if (!shopifyConfigured()) {
    return Response.json({ mode: "demo" });
  }

  try {
    const buyerIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const checkoutUrl = await createCheckout(selection, parsed.planId, { buyerIp });
    return Response.json({ mode: "live", checkoutUrl });
  } catch (error) {
    if (error instanceof StorefrontError) {
      console.error("[checkout]", error.message, error.detail ?? "");
      return Response.json({ error: error.message }, { status: 502 });
    }
    console.error("[checkout] unexpected", error);
    return Response.json({ error: "We couldn't start checkout. Try again in a moment." }, { status: 500 });
  }
}
