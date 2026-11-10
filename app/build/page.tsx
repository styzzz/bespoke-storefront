import type { Metadata } from "next";

import { Builder } from "@/components/Builder";
import type { StoreMode } from "@/components/Builder";
import { ADDITIONS, BASES } from "@/lib/catalog";
import type { LiveView } from "@/lib/pricing";
import { fetchLiveCatalog, shopifyConfigured, toLiveView } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Build your formula",
  description:
    "Choose a base, add up to three actives, and finish with collagen or plant stem cells. Every combination is checked as you build.",
};

// Re-read prices and plans from Shopify at most every five minutes.
export const revalidate = 300;

export default async function BuildPage() {
  let live: LiveView | null = null;
  let mode: StoreMode = "demo";

  if (shopifyConfigured()) {
    try {
      const catalog = await fetchLiveCatalog();
      live = toLiveView(catalog, [...BASES, ...ADDITIONS].map((item) => item.sku));
      mode = "live";
      if (catalog.missingProducts.length) {
        console.error("[build] Shopify products not found:", catalog.missingProducts.join(", "));
      }
    } catch (error) {
      console.error("[build] could not load the Shopify catalog", error);
      mode = "store-error";
    }
  }

  return (
    <main className="page page--builder">
      <header className="page__intro">
        <h1 className="page__title">Build your formula</h1>
        <p className="page__lead">
          Five choices, checked against each other as you go. Your price appears at the end.
        </p>
      </header>
      <Builder live={live} mode={mode} />
    </main>
  );
}
