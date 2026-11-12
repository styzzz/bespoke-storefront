# Bespoke ingredient knowledge base

> Generated from `lib/catalog/data.ts` by `npm run generate`. Edit the data file, not this document.

This is the background knowledge behind the builder: every base and ingredient, what it does, where it can be added, and why some combinations are blocked. The website reads the same data, so this document always matches what customers see.

**Before launch:** this was written from published cosmetic science, not from your lab's own formulas or stability tests. Have your formulating chemist confirm every concentration, pH range and rule, and replace the placeholder prices.

## How the builder decides what to grey out

1. **Solubility.** Every ingredient dissolves in water or in oil. A base lists which of the two it can carry. An oil-soluble ingredient is blocked in a base with no oil, and a water-soluble one in a base with no water.
2. **pH.** Every ingredient in a water-containing formula shares one pH. Each base and ingredient has a pH range. An ingredient is blocked unless its range overlaps the base and everything already chosen by at least 0.2 pH units.
3. **Pairs that never share a bottle.**
   - retinoid with exfoliant: Retinol and an exfoliating acid in one formula over-strip skin, and the acid breaks retinol down.
   - exfoliant with exfoliant: One exfoliating acid per formula. Stacking them raises the risk of irritation.
4. **Skin type.** Items carrying certain tags are blocked for certain skin types:
   - Oily skin blocks `rich`: Too rich for oily skin. Heavy butters and occlusive lipids add to the oil already there and can leave skin greasy or congested.
   - Dry skin blocks `oil-clearing`: Not suited to dry skin. It strips oil that dry skin needs to keep. Lactic acid is the gentler choice.
   - Sensitive skin blocks `strong-exfoliant`: Too strong for sensitive skin. It is likely to sting and cause redness.
   - Sensitive skin blocks `retinoid`: Retinol often irritates sensitive skin. Bakuchiol works on the same concerns far more gently.
5. **Room in the bottle.** Up to 3 actives, plus collagen peptides, plant stem cells or both.

The customer always sees the specific reason next to a greyed-out option. If an earlier choice stops fitting after a change (for example a new skin type), it is removed and the customer is told why.

## Skin types

- **Balanced:** Comfortable most days. Rarely tight, rarely shiny.
- **Oily:** Shiny by midday, with visible pores and occasional congestion.
- **Dry:** Feels tight after cleansing. Can look dull or flaky.
- **Combination:** Oily through the forehead, nose and chin. Normal or dry elsewhere.
- **Sensitive:** Reacts easily: stinging, redness or flushing with new products.

## Bases

### Serum bases (30 ml)

#### Aloe Water-Gel

- **SKU:** `BSP-BASE-SER-ALOE`
- **Key ingredients:** Aloe barbadensis leaf juice, glycerin, sclerotium gum
- **What the customer is told:** A weightless, oil-free gel built on organic aloe juice. Sinks in fast and leaves no film.
- **Formulation:** Water-only gel thickened with a plant-derived gum that tolerates low pH, so it can carry exfoliating acids. It has no oil phase, so oil-soluble actives (retinol, bakuchiol, vitamin E, ceramides) cannot be dissolved in it.
- **Carries:** water-soluble ingredients
- **pH:** 3.5 to 7
- **Best for:** Oily, Combination, Balanced
- **Size / placeholder price:** 30 ml / $84

#### Jojoba Milk Serum

- **SKU:** `BSP-BASE-SER-MILK`
- **Key ingredients:** Aloe barbadensis leaf juice, jojoba seed oil, sunflower lecithin
- **What the customer is told:** A fluid, milky serum with a little jojoba oil. The most flexible base: it carries both water-soluble and oil-soluble actives.
- **Formulation:** Light oil-in-water emulsion. Lecithin holds a small oil phase, which lets water-soluble and oil-soluble actives share one formula.
- **Carries:** water-soluble and oil-soluble ingredients
- **pH:** 3.5 to 7
- **Best for:** Balanced, Combination, Dry
- **Size / placeholder price:** 30 ml / $90

#### Squalane Oil Serum

- **SKU:** `BSP-BASE-SER-SQUALANE`
- **Key ingredients:** Squalane (olive-derived), jojoba seed oil, rosehip seed oil
- **What the customer is told:** A dry-touch facial oil of olive squalane, jojoba and rosehip. Softens and seals in moisture.
- **Formulation:** Anhydrous (contains no water). Only oil-soluble ingredients dissolve in it, so hyaluronic acid, niacinamide, acids, collagen and plant stem cell extract are not available. With no water there is no pH to manage.
- **Carries:** oil-soluble ingredients
- **pH:** none (contains no water)
- **Best for:** Dry, Balanced
- **Size / placeholder price:** 30 ml / $96

#### Oat Calming Essence

- **SKU:** `BSP-BASE-SER-OAT`
- **Key ingredients:** Avena sativa (oat) kernel extract, beta-glucan, glycerin
- **What the customer is told:** A fragrance-free, watery essence with oat extract and beta-glucan, made for skin that reacts easily.
- **Formulation:** Water-only essence held at a skin-neutral pH of 5 to 7 to stay gentle. Exfoliating acids need pH 3.5 to 4.2 to work, so they are not offered in this base. No oil phase.
- **Carries:** water-soluble ingredients
- **pH:** 5 to 7
- **Best for:** Sensitive, Dry
- **Size / placeholder price:** 30 ml / $87

### Moisturizer bases (50 ml)

#### Oil-Free Gel-Cream

- **SKU:** `BSP-BASE-MST-GEL`
- **Key ingredients:** Aloe barbadensis leaf juice, glycerin, sodium PCA
- **What the customer is told:** A cooling, oil-free gel-cream that hydrates without adding shine.
- **Formulation:** Water-only gel-cream. Humectants (glycerin, sodium PCA) hold water without oils or butters. No oil phase, so oil-soluble actives are not available.
- **Carries:** water-soluble ingredients
- **pH:** 3.5 to 7
- **Best for:** Oily, Combination
- **Size / placeholder price:** 50 ml / $90

#### Daily Jojoba Lotion

- **SKU:** `BSP-BASE-MST-LOTION`
- **Key ingredients:** Aloe barbadensis leaf juice, jojoba seed oil, sunflower seed oil
- **What the customer is told:** A light everyday lotion with jojoba and sunflower oils. Absorbs quickly and suits most skin.
- **Formulation:** Light oil-in-water emulsion that stays stable across a wide pH range, so it accepts the widest set of actives of any moisturizer base.
- **Carries:** water-soluble and oil-soluble ingredients
- **pH:** 3.5 to 7
- **Best for:** Balanced, Combination
- **Size / placeholder price:** 50 ml / $99

#### Mango Butter Cream

- **SKU:** `BSP-BASE-MST-BUTTER`
- **Key ingredients:** Mangifera indica (mango) seed butter, Theobroma cacao (cocoa) seed butter, rosehip seed oil, evening primrose oil
- **What the customer is told:** A thick, cushioning cream of organic mango and cocoa butters with rosehip and evening primrose oils.
- **Formulation:** Butter-rich emulsion. Its heavy lipid phase is occlusive, which helps dry skin and is too much for oily skin. Held at pH 4.5 or above to keep the emulsion stable, so exfoliating acids are not offered.
- **Carries:** water-soluble and oil-soluble ingredients
- **pH:** 4.5 to 7
- **Best for:** Dry
- **Size / placeholder price:** 50 ml / $108
- **Rule tags:** rich

#### Oat Barrier Cream

- **SKU:** `BSP-BASE-MST-BARRIER`
- **Key ingredients:** Colloidal oatmeal, oat kernel oil, glycerin, squalane
- **What the customer is told:** A fragrance-free, medium-weight cream with colloidal oatmeal for reactive or easily irritated skin.
- **Formulation:** Emulsion held close to the skin's own pH (5 to 6.5) to support the barrier. Exfoliating acids are not offered in this base.
- **Carries:** water-soluble and oil-soluble ingredients
- **pH:** 5 to 6.5
- **Best for:** Sensitive, Dry
- **Size / placeholder price:** 50 ml / $102

## Actives

### Hydrate and repair

Hold water in and rebuild the barrier.

#### Hyaluronic Acid (1%)

- **SKU:** `BSP-ACT-HA`
- **INCI:** Sodium hyaluronate (multi-weight)
- **Effect (shown to the customer):** Draws water into the upper layers of skin, so it looks plumper and feels less tight.
- **How it works:** A humectant: each molecule binds many times its weight in water. Larger molecules sit on the surface and slow water loss; smaller ones hydrate slightly deeper in the outer layer. It adds water, not oil, which is why it suits oily skin too. It does not replace the skin's own hyaluronic acid.
- **Evidence:** Well established. Well documented for surface hydration and short-term smoothing of fine lines.
- **Dissolves in:** water
- **Works at pH:** 3.5 to 8
- **Best for:** All skin types
- **Use:** morning and night
- **Lab notes (not shown to customers):** Breaks down slowly below pH 4. Acceptable in an acid formula with a one-month use period; confirm with stability testing.
- **Placeholder price:** $18

#### Ceramide Complex (2%)

- **SKU:** `BSP-ACT-CER`
- **INCI:** Ceramide NP, cholesterol, phytosphingosine
- **Effect (shown to the customer):** Replaces the lipids that hold skin cells together, so skin loses less water and feels less reactive.
- **How it works:** Ceramides, cholesterol and fatty acids form the mortar between cells in the outer skin layer. Supplying them together helps repair a weakened barrier. They need an oil phase to dissolve.
- **Evidence:** Good evidence. Ceramide-containing moisturizers improve barrier function and dryness in clinical studies; results depend on the full formula.
- **Dissolves in:** oil
- **Works at pH:** 4 to 7
- **Best for:** Dry, Sensitive, Balanced, Combination
- **Use:** morning and night
- **Lab notes (not shown to customers):** 2% refers to the lipid blend, not pure ceramide.
- **Placeholder price:** $21

#### Shea Lipid Boost (4%)

- **SKU:** `BSP-ACT-LIPID`
- **INCI:** Butyrospermum parkii (shea) butter, squalane
- **Effect (shown to the customer):** Adds a richer, more cushioned feel and seals moisture in for longer.
- **How it works:** Shea butter and squalane are emollients and occlusives: they soften the surface and slow evaporation. Helpful on dry skin; on oily skin they add to the oil already there.
- **Evidence:** Good evidence. Emollients and occlusives are a well-established way to reduce water loss.
- **Dissolves in:** oil
- **Works at pH:** 3.5 to 8
- **Best for:** Dry
- **Use:** morning and night
- **Rule tags:** rich
- **Placeholder price:** $15

### Brighten and protect

Even out tone and defend against daily stress.

#### Niacinamide (5%)

- **SKU:** `BSP-ACT-NIA`
- **INCI:** Niacinamide (vitamin B3)
- **Effect (shown to the customer):** Evens out tone, reduces shine and the look of pores, and strengthens the skin barrier.
- **How it works:** Vitamin B3 supports ceramide production, moderates oil output and slows the transfer of pigment to skin cells. It is stable at pH 5 to 7. In an acidic formula it slowly converts to nicotinic acid, which can cause flushing, so it is not combined with exfoliating acids in one bottle.
- **Evidence:** Well established. Multiple controlled trials at 2 to 5% for tone, barrier function and sebum.
- **Dissolves in:** water
- **Works at pH:** 5 to 7
- **Best for:** Oily, Combination, Balanced
- **Use:** morning and night
- **Placeholder price:** $15

#### Vitamin C (3%)

- **SKU:** `BSP-ACT-VITC`
- **INCI:** Sodium ascorbyl phosphate
- **Effect (shown to the customer):** Brightens dull skin and helps defend against pollution and UV-driven damage.
- **How it works:** A stable form of vitamin C that the skin converts to ascorbic acid. Pure ascorbic acid breaks down quickly in water; this form holds up, but only at pH 6 to 7. That is why it cannot share a formula with exfoliating acids.
- **Evidence:** Good evidence. Good antioxidant data and some clinical evidence; less studied than pure L-ascorbic acid.
- **Dissolves in:** water
- **Works at pH:** 6 to 7
- **Best for:** Balanced, Combination, Oily, Dry
- **Use:** morning and night
- **Lab notes (not shown to customers):** Protect from light and air. Airless, opaque packaging recommended.
- **Placeholder price:** $24

#### Green Tea Extract (2%)

- **SKU:** `BSP-ACT-GT`
- **INCI:** Camellia sinensis leaf extract
- **Effect (shown to the customer):** An antioxidant that calms the look of redness and helps protect skin through the day.
- **How it works:** Green tea polyphenols, mainly EGCG, neutralise free radicals and have anti-inflammatory activity. EGCG is stable in mildly acidic formulas and breaks down as pH rises toward neutral, so it is not paired with ingredients that need pH 6 or higher.
- **Evidence:** Good evidence. Solid laboratory data and several small human studies.
- **Dissolves in:** water
- **Works at pH:** 3.5 to 5.8
- **Best for:** Oily, Combination, Sensitive, Balanced
- **Use:** morning and night
- **Placeholder price:** $12

#### Vitamin E (1%)

- **SKU:** `BSP-ACT-VITE`
- **INCI:** Tocopherol (mixed, sunflower-derived)
- **Effect (shown to the customer):** Protects skin lipids from oxidation and adds a conditioned, supple feel.
- **How it works:** An oil-soluble antioxidant that sits in the skin's lipid layer. It also protects the oils in the formula itself from going rancid. It works well alongside vitamin C.
- **Evidence:** Good evidence. Long-established antioxidant; strongest data is in combination with vitamin C.
- **Dissolves in:** oil
- **Works at pH:** 3.5 to 8
- **Best for:** Dry, Balanced
- **Use:** morning and night
- **Placeholder price:** $12

### Resurface

Exfoliating acids. One per formula.

#### Glycolic Acid (5%)

- **SKU:** `BSP-ACT-GLY`
- **INCI:** Glycolic acid
- **Effect (shown to the customer):** Lifts away dull surface cells for smoother texture and a brighter, more even look.
- **How it works:** The smallest alpha hydroxy acid, so it penetrates most readily. It loosens the bonds between dead surface cells. It only works in an acidic formula (pH 3.5 to 4.2), which sets the pH for everything else in the bottle.
- **Evidence:** Well established. Extensively studied for texture, tone and photodamage.
- **Dissolves in:** water
- **Works at pH:** 3.5 to 4.2
- **Best for:** Balanced, Combination, Oily
- **Use:** at night only
- **Customer cautions:** Use at night and wear SPF 30 or higher every day. Exfoliating acids make skin more sensitive to the sun. A brief tingle on application is normal. Stop if skin burns or stays red.
- **Lab notes (not shown to customers):** Keep at 10% or below and pH 3.5 or above for consumer leave-on use. US labelling should carry the FDA-recommended sunburn alert for AHA products.
- **Rule tags:** exfoliant, strong-exfoliant
- **Placeholder price:** $18

#### Lactic Acid (5%)

- **SKU:** `BSP-ACT-LAC`
- **INCI:** Lactic acid
- **Effect (shown to the customer):** A gentler exfoliant that smooths texture while helping skin hold on to water.
- **How it works:** An alpha hydroxy acid with a larger molecule than glycolic acid, so it works more slowly and with less sting. It is also part of the skin's natural moisturizing factor, so it hydrates as it exfoliates.
- **Evidence:** Well established. Well studied for exfoliation and for improving dry, rough skin.
- **Dissolves in:** water
- **Works at pH:** 3.5 to 4.2
- **Best for:** Dry, Balanced, Combination
- **Use:** at night only
- **Customer cautions:** Use at night and wear SPF 30 or higher every day. Exfoliating acids make skin more sensitive to the sun.
- **Lab notes (not shown to customers):** Same pH and sunburn-alert considerations as glycolic acid.
- **Rule tags:** exfoliant
- **Placeholder price:** $18

#### Salicylic Acid (2%)

- **SKU:** `BSP-ACT-SAL`
- **INCI:** Salicylic acid
- **Effect (shown to the customer):** Clears out pores and reduces surface oil for a smoother, less congested look.
- **How it works:** A beta hydroxy acid. Unlike AHAs it is attracted to oil, so it works inside the pore lining and dissolves the mix of sebum and dead cells that clogs it. That oil-clearing action is drying on skin that is already dry.
- **Evidence:** Well established. Extensively studied at 0.5 to 2% for pores and congestion.
- **Dissolves in:** water
- **Works at pH:** 3.5 to 4.2
- **Best for:** Oily, Combination
- **Use:** at night only
- **Customer cautions:** Use at night and wear SPF 30 or higher every day. Exfoliating acids make skin more sensitive to the sun. Do not use if you are allergic to aspirin or other salicylates.
- **Lab notes (not shown to customers):** Needs a glycol or similar solubiliser in the water phase. In the US, 0.5 to 2% salicylic acid sold with acne claims is an over-the-counter drug; keep claims cosmetic (pores, texture, oil) unless you register it as one.
- **Rule tags:** exfoliant, strong-exfoliant, oil-clearing
- **Placeholder price:** $18

### Renew

Smooth lines and texture over time.

#### Retinol (0.3%)

- **SKU:** `BSP-ACT-RET`
- **INCI:** Retinol (encapsulated)
- **Effect (shown to the customer):** Speeds up skin renewal to soften fine lines, refine texture and even out tone.
- **How it works:** Vitamin A. The skin converts it to retinoic acid, which increases cell turnover and collagen production. It is oil-soluble, breaks down in light, air and acid, and can cause dryness and peeling while skin adjusts.
- **Evidence:** Well established. The best-studied cosmetic ingredient for photoaging.
- **Dissolves in:** oil
- **Works at pH:** 5 to 7
- **Best for:** Balanced, Combination, Oily, Dry
- **Use:** at night only
- **Customer cautions:** Night use only. Wear SPF 30 or higher every day. Do not use while pregnant, trying to conceive or breastfeeding. Start with two or three nights a week and build up.
- **Lab notes (not shown to customers):** 0.3% is the EU maximum for leave-on face products. Needs airless, opaque packaging and an antioxidant in the oil phase.
- **Rule tags:** retinoid
- **Placeholder price:** $27

#### Bakuchiol (1%)

- **SKU:** `BSP-ACT-BAK`
- **INCI:** Bakuchiol
- **Effect (shown to the customer):** A plant-derived alternative to retinol for lines and uneven tone, without the peeling.
- **How it works:** Extracted from the seeds of the babchi plant. It is not a retinoid but switches on many of the same skin-renewal pathways, and it is stable in light, so it can be used morning and night.
- **Evidence:** Good evidence. A 12-week randomised trial found it improved wrinkles and pigmentation about as well as retinol, with less scaling and stinging. Fewer studies than retinol overall.
- **Dissolves in:** oil
- **Works at pH:** 3.5 to 7.5
- **Best for:** Sensitive, Dry, Balanced, Combination
- **Use:** morning and night
- **Placeholder price:** $24

### Soothe

Calm redness and reactivity.

#### Centella (Cica) (2%)

- **SKU:** `BSP-ACT-CICA`
- **INCI:** Centella asiatica extract
- **Effect (shown to the customer):** Calms visible redness and helps irritated skin settle.
- **How it works:** Centella's active compounds (madecassoside, asiaticoside) reduce inflammatory signalling and support barrier repair.
- **Evidence:** Good evidence. Long history in wound care; a growing number of cosmetic studies.
- **Dissolves in:** water
- **Works at pH:** 4 to 7
- **Best for:** Sensitive, Dry, Combination
- **Use:** morning and night
- **Placeholder price:** $15

## Boosters

#### Collagen Peptides (2%)

- **SKU:** `BSP-BST-COL`
- **INCI:** Hydrolyzed collagen
- **Effect (shown to the customer):** Moisture-binding peptides that form a light film, so skin feels smoother, softer and more supple.
- **How it works:** Collagen fragments work at the surface: they hold water and form a flexible film that slows moisture loss. Applied to skin they do not reach the deeper layer or replace the skin's own collagen.
- **Evidence:** Good evidence. Supported for hydration and skin feel. There is little evidence that topical collagen firms skin or reduces wrinkles.
- **Dissolves in:** water
- **Works at pH:** 4 to 7
- **Best for:** Dry, Balanced, Combination
- **Use:** morning and night
- **Lab notes (not shown to customers):** Confirm and declare the source (marine, bovine or fermentation-derived): it decides allergen and vegan labelling. Avoid firming or wrinkle claims based on this ingredient.
- **Placeholder price:** $27

#### Plant Stem Cells (2%)

- **SKU:** `BSP-BST-PSC`
- **INCI:** Plant cell culture extract
- **Effect (shown to the customer):** An antioxidant-rich extract grown from plant cells, chosen to help defend skin against daily environmental stress.
- **How it works:** Plant cells are grown in culture and their contents extracted, giving a concentrated source of antioxidants and other plant metabolites. They are plant-derived, not human, and do not act as stem cells in skin.
- **Evidence:** Early evidence. Evidence is mostly laboratory and supplier studies, with few independent clinical trials.
- **Dissolves in:** water
- **Works at pH:** 4 to 7.5
- **Best for:** All skin types
- **Use:** morning and night
- **Lab notes (not shown to customers):** Replace the INCI with your actual material (for example Malus domestica fruit cell culture extract) and confirm its supplier pH range.
- **Placeholder price:** $36

## Where each ingredient can be added

Checked for balanced skin, so only base rules show.

| Ingredient | Aloe Water-Gel | Jojoba Milk Serum | Squalane Oil Serum | Oat Calming Essence | Oil-Free Gel-Cream | Daily Jojoba Lotion | Mango Butter Cream | Oat Barrier Cream |
|---|---|---|---|---|---|---|---|---|
| Hyaluronic Acid | yes | yes | no: solubility | yes | yes | yes | yes | yes |
| Ceramide Complex | no: solubility | yes | yes | no: solubility | no: solubility | yes | yes | yes |
| Shea Lipid Boost | no: solubility | yes | yes | no: solubility | no: solubility | yes | yes | yes |
| Niacinamide | yes | yes | no: solubility | yes | yes | yes | yes | yes |
| Vitamin C | yes | yes | no: solubility | yes | yes | yes | yes | yes |
| Green Tea Extract | yes | yes | no: solubility | yes | yes | yes | yes | yes |
| Vitamin E | no: solubility | yes | yes | no: solubility | no: solubility | yes | yes | yes |
| Glycolic Acid | yes | yes | no: solubility | no: pH | yes | yes | no: pH | no: pH |
| Lactic Acid | yes | yes | no: solubility | no: pH | yes | yes | no: pH | no: pH |
| Salicylic Acid | yes | yes | no: solubility | no: pH | yes | yes | no: pH | no: pH |
| Retinol | no: solubility | yes | yes | no: solubility | no: solubility | yes | yes | yes |
| Bakuchiol | no: solubility | yes | yes | no: solubility | no: solubility | yes | yes | yes |
| Centella (Cica) | yes | yes | no: solubility | yes | yes | yes | yes | yes |
| Collagen Peptides | yes | yes | no: solubility | yes | yes | yes | yes | yes |
| Plant Stem Cells | yes | yes | no: solubility | yes | yes | yes | yes | yes |

## Which ingredients can be combined

Read across: with the ingredient in the row already chosen, can the ingredient in the column be added? Checked in Jojoba Milk Serum, the most flexible base.

| | Hyaluronic Acid | Ceramide Complex | Shea Lipid Boost | Niacinamide | Vitamin C | Green Tea Extract | Vitamin E | Glycolic Acid | Lactic Acid | Salicylic Acid | Retinol | Bakuchiol | Centella (Cica) | Collagen Peptides | Plant Stem Cells |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Hyaluronic Acid** |  | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |
| **Ceramide Complex** | yes |  | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |
| **Shea Lipid Boost** | yes | yes |  | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |
| **Niacinamide** | yes | yes | yes |  | yes | yes | yes | no: pH | no: pH | no: pH | yes | yes | yes | yes | yes |
| **Vitamin C** | yes | yes | yes | yes |  | no: pH | yes | no: pH | no: pH | no: pH | yes | yes | yes | yes | yes |
| **Green Tea Extract** | yes | yes | yes | yes | no: pH |  | yes | yes | yes | yes | yes | yes | yes | yes | yes |
| **Vitamin E** | yes | yes | yes | yes | yes | yes |  | yes | yes | yes | yes | yes | yes | yes | yes |
| **Glycolic Acid** | yes | yes | yes | no: pH | no: pH | yes | yes |  | no: one acid | no: one acid | no: retinol + acid | yes | yes | yes | yes |
| **Lactic Acid** | yes | yes | yes | no: pH | no: pH | yes | yes | no: one acid |  | no: one acid | no: retinol + acid | yes | yes | yes | yes |
| **Salicylic Acid** | yes | yes | yes | no: pH | no: pH | yes | yes | no: one acid | no: one acid |  | no: retinol + acid | yes | yes | yes | yes |
| **Retinol** | yes | yes | yes | yes | yes | yes | yes | no: retinol + acid | no: retinol + acid | no: retinol + acid |  | yes | yes | yes | yes |
| **Bakuchiol** | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |  | yes | yes | yes |
| **Centella (Cica)** | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |  | yes | yes |
| **Collagen Peptides** | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |  | yes |
| **Plant Stem Cells** | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |  |

## Skin type suitability

| | Balanced | Oily | Dry | Combination | Sensitive |
|---|---|---|---|---|---|
| Aloe Water-Gel | recommended | recommended | available | recommended | available |
| Jojoba Milk Serum | recommended | available | recommended | recommended | available |
| Squalane Oil Serum | recommended | available | recommended | available | available |
| Oat Calming Essence | available | available | recommended | available | recommended |
| Oil-Free Gel-Cream | available | recommended | available | recommended | available |
| Daily Jojoba Lotion | recommended | available | available | recommended | available |
| Mango Butter Cream | available | greyed out | recommended | available | available |
| Oat Barrier Cream | available | available | recommended | available | recommended |
| Hyaluronic Acid | recommended | recommended | recommended | recommended | recommended |
| Ceramide Complex | recommended | available | recommended | recommended | recommended |
| Shea Lipid Boost | available | greyed out | recommended | available | available |
| Niacinamide | recommended | recommended | available | recommended | available |
| Vitamin C | recommended | recommended | recommended | recommended | available |
| Green Tea Extract | recommended | recommended | available | recommended | recommended |
| Vitamin E | recommended | available | recommended | available | available |
| Glycolic Acid | recommended | recommended | available | recommended | greyed out |
| Lactic Acid | recommended | available | recommended | recommended | available |
| Salicylic Acid | available | recommended | greyed out | recommended | greyed out |
| Retinol | recommended | recommended | recommended | recommended | greyed out |
| Bakuchiol | recommended | available | recommended | recommended | recommended |
| Centella (Cica) | available | available | recommended | recommended | recommended |
| Collagen Peptides | recommended | available | recommended | recommended | available |
| Plant Stem Cells | recommended | recommended | recommended | recommended | recommended |

## Plans

| Plan | Deliveries | Placeholder discount |
|---|---|---|
| One-time purchase | 1 | 0% |
| 3-month plan | 3 | 10% |
| Annual plan | 12 | 20% |
