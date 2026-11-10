# Setup: from this folder to bespoke.madefromearth.com

Four parts, in this order: GitHub, Shopify, Vercel, the subdomain. Allow about an hour.

The site works before Shopify is connected. It runs in **preview mode**: placeholder prices, and the checkout button explains that checkout is not connected. It switches to live mode by itself once the two Shopify environment variables are set in Vercel.

## 1. Put the code on GitHub

1. Create a new **private** repository on GitHub, for example `madefromearth/bespoke-storefront`. Leave it empty (no README).
2. From this folder:

   ```bash
   git remote add origin https://github.com/YOUR-ACCOUNT/bespoke-storefront.git
   git push -u origin main
   ```

Never commit real tokens. `.env.local` is already ignored by git.

## 2. Shopify

Store: `spdesa-qx.myshopify.com`.

### 2a. Create the four component products

A custom formula is sold as a set of components: one base plus each active and booster. Each component is a variant in Shopify, matched to this site by **SKU**. The price the customer sees is the sum of the variant prices, and Shopify's checkout charges exactly that.

1. In Shopify admin go to **Products > Import** and upload `shopify/products-import.csv`.
2. That creates four products:

   | Product | Handle | Variants |
   |---|---|---|
   | Bespoke Serum | `bespoke-serum` | the 4 serum bases |
   | Bespoke Moisturizer | `bespoke-moisturizer` | the 4 moisturizer bases |
   | Bespoke Active | `bespoke-actives` | the 13 actives |
   | Bespoke Booster | `bespoke-boosters` | collagen peptides, plant stem cells |

3. Set your real prices on each variant. The prices in the file are placeholders.
4. Do not change the handles or the SKUs. If the import rejects a column, create the four products by hand with the same handles, SKUs and one option each.
5. Leave inventory tracking off for these variants, or keep stock above zero. A variant that is out of stock shows as "Temporarily unavailable" in the builder.

### 2b. Add the Headless sales channel

1. In Shopify admin, add the **Headless** sales channel (Sales channels > search "Headless").
2. Create a storefront in it, for example "Bespoke".
3. Open **Storefront API** and copy the **private access token**. This is a secret: it goes into Vercel in step 3 and nowhere else.
4. In the storefront's API permissions, make sure product listings and **selling plans** are allowed (`unauthenticated_read_product_listings`, `unauthenticated_read_selling_plans`), plus the checkout permissions that are on by default.
5. Publish the four bespoke products to the **Headless** channel (Products > select all four > Bulk actions > Include in sales channels). Leave them **off** the Online Store channel so they do not appear on the main site.

### 2c. Subscription plans

1. Install a subscriptions app. This was built for the **Shopify Subscriptions** app; any app that creates standard Shopify selling plans works.
2. Create one plan group applied to **all four** bespoke products, with two plans:

   | Plan name must contain | Delivery | Discount |
   |---|---|---|
   | `3-Month` (for example "Bespoke 3-Month Plan") | every month | a **percentage**, for example 10% |
   | `Annual` (for example "Bespoke Annual Plan") | every month | a **percentage**, for example 20% |

3. The site finds the plans by those words in the name, reads the discount from Shopify and shows it. A plan appears in the builder only when it is attached to all four products with the same percentage discount. Until then customers see the one-time purchase only.
4. Set the plan length (3 or 12 deliveries) and cancellation terms in the app. Then check that the text in `lib/config.ts` (`PLAN_BILLING_NOTE`) and the plan descriptions in `lib/catalog/data.ts` (`PLANS`) say what the app actually does.

Open decision for you: whether customers **pay monthly** or **pay up front** for 3 or 12 months. The site assumes pay monthly. Prepaid plans were not confirmed as supported by the Shopify Subscriptions app; if you want prepaid, choose an app that offers it and update the wording in the two files above.

## 3. Vercel

1. At vercel.com choose **Add New > Project** and import the GitHub repository. Vercel detects Next.js; keep the defaults.
2. Before deploying, add these under **Environment Variables** (Production and Preview):

   | Name | Value |
   |---|---|
   | `SHOPIFY_STORE_DOMAIN` | `spdesa-qx.myshopify.com` |
   | `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | the private token from step 2b |
   | `NEXT_PUBLIC_SITE_URL` | `https://bespoke.madefromearth.com` |

3. Deploy. Every later push to `main` deploys automatically.

**This first deploy is the first real production build.** The code was tested here (rule tests, type checks against stand-in types, and a browser run of the real pages), but the workspace it was written in could not download Next.js, so `next build` itself has not been run. If the build log shows an error, send it over and it can be fixed quickly.

## 4. The subdomain

1. In Vercel: **Project > Settings > Domains > Add** `bespoke.madefromearth.com`.
2. Vercel shows one DNS record to create, a **CNAME** for `bespoke`. Copy the value it gives you.
3. Add that record wherever madefromearth.com's DNS is managed. If the domain is managed in Shopify, that is **Settings > Domains > madefromearth.com > DNS settings > Add custom record**. Do not touch the existing records for the main site.
4. Wait for Vercel to show the domain as valid (minutes, sometimes up to an hour). HTTPS is issued automatically.

## 5. Test before announcing it

- [ ] `/build` no longer shows the "Preview mode" banner.
- [ ] Prices in the review step match the variant prices in Shopify.
- [ ] The 3-month and annual plans appear with the right discounts.
- [ ] Build a formula and continue to checkout. The cart has one line per component and the total matches.
- [ ] Place a test order (Shopify's test payment mode). Open the order and confirm you can read the formula (see below).
- [ ] Repeat with a plan selected. The order shows a subscription.
- [ ] Try on a phone.

## How an order looks, and how the lab reads it

Each formula arrives as one line per component. The **base line** carries the formula:

- `Formula`: for example "Daily Jojoba Lotion with Glycolic Acid 5%, Hyaluronic Acid 1% and Collagen Peptides 2%"
- `Skin type`, `Size`, `Target pH`

Every line of the same formula shares a hidden batch code (`_bespoke_batch`) and a formula code (`_bespoke_code`, for example `MST-LOTION/OILY/GLY+HA/COL`). The same summary is in the order note. Properties starting with an underscore are normally hidden from the customer at checkout; confirm this on your test order.

## Changing things later

| To change | Edit |
|---|---|
| Prices | The variant prices in Shopify. The site follows within five minutes. |
| Plan discounts | The selling plans in your subscriptions app. |
| Ingredients, concentrations, pH ranges, which options grey out | `lib/catalog/data.ts`, then run `npm run generate` and `npm test`. Add any new SKU as a variant in Shopify. |
| Colours | The six values at the top of `app/globals.css`. |
| Show prices while choosing (off by default) | `SHOW_PRICES_WHILE_BUILDING` in `lib/config.ts`. |
| Wording under the plans, patch-test note | `lib/config.ts`. |

## Known limits

- **One line per component at checkout.** A formula with three actives and both boosters is six cart lines. Combining them into a single line with one price needs a Shopify cart-transform app, which for a custom app generally means Shopify Plus.
- **One formula per checkout.** There is no cart page; "Continue to checkout" goes straight to Shopify checkout with that formula.
- **Regulatory wording.** Ingredient claims are written as cosmetic claims. Have them checked for the markets you sell in, along with the notes in `docs/INGREDIENTS.md` on glycolic acid, salicylic acid, retinol and the collagen source.
