# Made from Earth Bespoke

A headless Shopify storefront for `bespoke.madefromearth.com`. Customers build their own serum or moisturizer: product type, skin type, base, up to three actives, then collagen peptides and/or plant stem cells. The site checks every combination, shows the price at the end, and hands the formula to Shopify checkout as a one-time purchase or on a 3-month or annual plan.

Next.js (App Router) on Vercel. Shopify Storefront API for prices, plans and checkout. No database.

## Start here

- **Going live:** [docs/SETUP.md](docs/SETUP.md) (GitHub, Shopify, Vercel, the subdomain).
- **Ingredient knowledge base:** [docs/INGREDIENTS.md](docs/INGREDIENTS.md). Every base and ingredient, what it does, where it can be added, and the compatibility tables.

## How it fits together

```
lib/catalog/data.ts     The catalog: bases, actives, boosters, skin rules, plans. Edit this.
lib/rules.ts            Compatibility engine: solubility, pH, conflicts, skin type, limits.
lib/pricing.ts          Totals and plan discounts, in cents.
lib/shopify.ts          Storefront API: live prices, selling plans, cart and checkout.
lib/config.ts           Site settings.

app/page.tsx            Home
app/build/page.tsx      Builder (reads live prices from Shopify, then renders components/Builder.tsx)
app/ingredients/        Ingredient library, generated from the catalog
app/api/checkout/       Re-checks the formula on the server, creates the Shopify cart
app/globals.css         All styling. Brand colours are the six values at the top.

scripts/generate.ts     Rebuilds docs/INGREDIENTS.md and shopify/products-import.csv from the catalog
tests/                  Tests for the rules, pricing, catalog and the Shopify integration
```

The rules engine knows nothing about specific ingredients. It reads each item's solubility, pH range and tags from the catalog, so adding or changing an ingredient is a data edit.

## Run it locally

Needs Node 22. The first `npm install` creates `package-lock.json`; commit it so every deploy installs the same versions.

```bash
npm install
cp .env.example .env.local   # optional: leave the token empty to run in preview mode
npm run dev                  # http://localhost:3000
```

```bash
npm test            # rules, pricing and catalog tests
npm run typecheck
npm run generate    # after editing the catalog
npm run build       # production build
```

## Status

- Prices in the catalog are placeholders. Live prices come from Shopify once connected.
- The brand colours in `app/globals.css` are provisional.
- Ingredient data was written from published cosmetic science and needs sign-off from your formulating chemist before launch.
- `next build` has not been run yet: the workspace this was written in could not download Next.js. The first Vercel deploy is the first production build.
