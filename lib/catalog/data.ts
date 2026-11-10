/**
 * THE CATALOG. This is the one file to edit when ingredients, prices,
 * concentrations or compatibility rules change.
 *
 * - Prices are placeholders in USD. Once Shopify is connected, the prices on
 *   the matching Shopify variants (matched by SKU) are shown instead.
 * - pH windows, phases and tags are what the rules engine reads. Change a
 *   window or add a tag and the builder greys options out accordingly.
 * - All of this must be reviewed by your formulating chemist before launch.
 */

import type {
  ActiveGroup,
  Addition,
  Base,
  PairConflict,
  Plan,
  SkinBlock,
  SkinProfile,
  SkinType,
} from "./types";

/* ------------------------------------------------------------------ */
/* Skin types                                                          */
/* ------------------------------------------------------------------ */

export const SKIN_TYPES: SkinProfile[] = [
  {
    id: "normal",
    name: "Balanced",
    description: "Comfortable most days. Rarely tight, rarely shiny.",
  },
  {
    id: "oily",
    name: "Oily",
    description: "Shiny by midday, with visible pores and occasional congestion.",
  },
  {
    id: "dry",
    name: "Dry",
    description: "Feels tight after cleansing. Can look dull or flaky.",
  },
  {
    id: "combination",
    name: "Combination",
    description: "Oily through the forehead, nose and chin. Normal or dry elsewhere.",
  },
  {
    id: "sensitive",
    name: "Sensitive",
    description: "Reacts easily: stinging, redness or flushing with new products.",
  },
];

/* ------------------------------------------------------------------ */
/* Bases                                                               */
/* ------------------------------------------------------------------ */

export const BASES: Base[] = [
  // ---- Serum bases (30 ml, one-month supply) ----
  {
    kind: "base",
    id: "ser-aloe",
    sku: "BSP-BASE-SER-ALOE",
    productType: "serum",
    name: "Aloe Water-Gel",
    summary:
      "A weightless, oil-free gel built on organic aloe juice. Sinks in fast and leaves no film.",
    keyIngredients: "Aloe barbadensis leaf juice, glycerin, sclerotium gum",
    phases: ["water"],
    ph: { min: 3.5, max: 7.0 },
    tags: [],
    bestFor: ["oily", "combination", "normal"],
    price: 28,
    sizeMl: 30,
    color: "#CFE6D6",
    science:
      "Water-only gel thickened with a plant-derived gum that tolerates low pH, so it can carry exfoliating acids. It has no oil phase, so oil-soluble actives (retinol, bakuchiol, vitamin E, ceramides) cannot be dissolved in it.",
  },
  {
    kind: "base",
    id: "ser-milk",
    sku: "BSP-BASE-SER-MILK",
    productType: "serum",
    name: "Jojoba Milk Serum",
    summary:
      "A fluid, milky serum with a little jojoba oil. The most flexible base: it carries both water-soluble and oil-soluble actives.",
    keyIngredients: "Aloe barbadensis leaf juice, jojoba seed oil, sunflower lecithin",
    phases: ["water", "oil"],
    ph: { min: 3.5, max: 7.0 },
    tags: [],
    bestFor: ["normal", "combination", "dry"],
    price: 30,
    sizeMl: 30,
    color: "#EDE9D2",
    science:
      "Light oil-in-water emulsion. Lecithin holds a small oil phase, which lets water-soluble and oil-soluble actives share one formula.",
  },
  {
    kind: "base",
    id: "ser-squalane",
    sku: "BSP-BASE-SER-SQUALANE",
    productType: "serum",
    name: "Squalane Oil Serum",
    summary:
      "A dry-touch facial oil of olive squalane, jojoba and rosehip. Softens and seals in moisture.",
    keyIngredients: "Squalane (olive-derived), jojoba seed oil, rosehip seed oil",
    phases: ["oil"],
    ph: null,
    tags: [],
    bestFor: ["dry", "normal"],
    price: 32,
    sizeMl: 30,
    color: "#E9D9A0",
    science:
      "Anhydrous (contains no water). Only oil-soluble ingredients dissolve in it, so hyaluronic acid, niacinamide, acids, collagen and plant stem cell extract are not available. With no water there is no pH to manage.",
  },
  {
    kind: "base",
    id: "ser-oat",
    sku: "BSP-BASE-SER-OAT",
    productType: "serum",
    name: "Oat Calming Essence",
    summary:
      "A fragrance-free, watery essence with oat extract and beta-glucan, made for skin that reacts easily.",
    keyIngredients: "Avena sativa (oat) kernel extract, beta-glucan, glycerin",
    phases: ["water"],
    ph: { min: 5.0, max: 7.0 },
    tags: [],
    bestFor: ["sensitive", "dry"],
    price: 29,
    sizeMl: 30,
    color: "#E7E2D3",
    science:
      "Water-only essence held at a skin-neutral pH of 5 to 7 to stay gentle. Exfoliating acids need pH 3.5 to 4.2 to work, so they are not offered in this base. No oil phase.",
  },

  // ---- Moisturizer bases (50 ml, one-month supply) ----
  {
    kind: "base",
    id: "mst-gel",
    sku: "BSP-BASE-MST-GEL",
    productType: "moisturizer",
    name: "Oil-Free Gel-Cream",
    summary:
      "A cooling, oil-free gel-cream that hydrates without adding shine.",
    keyIngredients: "Aloe barbadensis leaf juice, glycerin, sodium PCA",
    phases: ["water"],
    ph: { min: 3.5, max: 7.0 },
    tags: [],
    bestFor: ["oily", "combination"],
    price: 30,
    sizeMl: 50,
    color: "#CFE6D6",
    science:
      "Water-only gel-cream. Humectants (glycerin, sodium PCA) hold water without oils or butters. No oil phase, so oil-soluble actives are not available.",
  },
  {
    kind: "base",
    id: "mst-lotion",
    sku: "BSP-BASE-MST-LOTION",
    productType: "moisturizer",
    name: "Daily Jojoba Lotion",
    summary:
      "A light everyday lotion with jojoba and sunflower oils. Absorbs quickly and suits most skin.",
    keyIngredients: "Aloe barbadensis leaf juice, jojoba seed oil, sunflower seed oil",
    phases: ["water", "oil"],
    ph: { min: 3.5, max: 7.0 },
    tags: [],
    bestFor: ["normal", "combination"],
    price: 32,
    sizeMl: 50,
    color: "#EDE9D2",
    science:
      "Light oil-in-water emulsion that stays stable across a wide pH range, so it accepts the widest set of actives of any moisturizer base.",
  },
  {
    kind: "base",
    id: "mst-butter",
    sku: "BSP-BASE-MST-BUTTER",
    productType: "moisturizer",
    name: "Mango Butter Cream",
    summary:
      "A thick, cushioning cream of organic mango and cocoa butters with rosehip and evening primrose oils.",
    keyIngredients:
      "Mangifera indica (mango) seed butter, Theobroma cacao (cocoa) seed butter, rosehip seed oil, evening primrose oil",
    phases: ["water", "oil"],
    ph: { min: 4.5, max: 7.0 },
    tags: ["rich"],
    bestFor: ["dry"],
    price: 36,
    sizeMl: 50,
    color: "#F0DFB4",
    science:
      "Butter-rich emulsion. Its heavy lipid phase is occlusive, which helps dry skin and is too much for oily skin. Held at pH 4.5 or above to keep the emulsion stable, so exfoliating acids are not offered.",
  },
  {
    kind: "base",
    id: "mst-barrier",
    sku: "BSP-BASE-MST-BARRIER",
    productType: "moisturizer",
    name: "Oat Barrier Cream",
    summary:
      "A fragrance-free, medium-weight cream with colloidal oatmeal for reactive or easily irritated skin.",
    keyIngredients: "Colloidal oatmeal, oat kernel oil, glycerin, squalane",
    phases: ["water", "oil"],
    ph: { min: 5.0, max: 6.5 },
    tags: [],
    bestFor: ["sensitive", "dry"],
    price: 34,
    sizeMl: 50,
    color: "#E7E2D3",
    science:
      "Emulsion held close to the skin's own pH (5 to 6.5) to support the barrier. Exfoliating acids are not offered in this base.",
  },
];

/* ------------------------------------------------------------------ */
/* Actives                                                             */
/* ------------------------------------------------------------------ */

export const ACTIVE_GROUPS: { id: ActiveGroup; name: string; description: string }[] = [
  { id: "hydrate", name: "Hydrate and repair", description: "Hold water in and rebuild the barrier." },
  { id: "brighten", name: "Brighten and protect", description: "Even out tone and defend against daily stress." },
  { id: "resurface", name: "Resurface", description: "Exfoliating acids. One per formula." },
  { id: "renew", name: "Renew", description: "Smooth lines and texture over time." },
  { id: "soothe", name: "Soothe", description: "Calm redness and reactivity." },
];

const SUN_CAUTION =
  "Use at night and wear SPF 30 or higher every day. Exfoliating acids make skin more sensitive to the sun.";

export const ACTIVES: Addition[] = [
  // ---- Hydrate and repair ----
  {
    kind: "active",
    id: "ha",
    sku: "BSP-ACT-HA",
    group: "hydrate",
    name: "Hyaluronic Acid",
    inci: "Sodium hyaluronate (multi-weight)",
    dose: "1%",
    phase: "water",
    ph: { min: 3.5, max: 8.0 },
    tags: [],
    bestFor: ["normal", "oily", "dry", "combination", "sensitive"],
    usage: "am-pm",
    effect:
      "Draws water into the upper layers of skin, so it looks plumper and feels less tight.",
    science:
      "A humectant: each molecule binds many times its weight in water. Larger molecules sit on the surface and slow water loss; smaller ones hydrate slightly deeper in the outer layer. It adds water, not oil, which is why it suits oily skin too. It does not replace the skin's own hyaluronic acid.",
    evidence: "strong",
    evidenceNote: "Well documented for surface hydration and short-term smoothing of fine lines.",
    cautions: [],
    labNotes:
      "Breaks down slowly below pH 4. Acceptable in an acid formula with a one-month use period; confirm with stability testing.",
    price: 6,
    color: "#A9D3E8",
  },
  {
    kind: "active",
    id: "cer",
    sku: "BSP-ACT-CER",
    group: "hydrate",
    name: "Ceramide Complex",
    inci: "Ceramide NP, cholesterol, phytosphingosine",
    dose: "2%",
    phase: "oil",
    ph: { min: 4.0, max: 7.0 },
    tags: [],
    bestFor: ["dry", "sensitive", "normal", "combination"],
    usage: "am-pm",
    effect:
      "Replaces the lipids that hold skin cells together, so skin loses less water and feels less reactive.",
    science:
      "Ceramides, cholesterol and fatty acids form the mortar between cells in the outer skin layer. Supplying them together helps repair a weakened barrier. They need an oil phase to dissolve.",
    evidence: "moderate",
    evidenceNote:
      "Ceramide-containing moisturizers improve barrier function and dryness in clinical studies; results depend on the full formula.",
    cautions: [],
    labNotes: "2% refers to the lipid blend, not pure ceramide.",
    price: 7,
    color: "#F2E6C4",
  },
  {
    kind: "active",
    id: "lipid",
    sku: "BSP-ACT-LIPID",
    group: "hydrate",
    name: "Shea Lipid Boost",
    inci: "Butyrospermum parkii (shea) butter, squalane",
    dose: "4%",
    phase: "oil",
    ph: { min: 3.5, max: 8.0 },
    tags: ["rich"],
    bestFor: ["dry"],
    usage: "am-pm",
    effect: "Adds a richer, more cushioned feel and seals moisture in for longer.",
    science:
      "Shea butter and squalane are emollients and occlusives: they soften the surface and slow evaporation. Helpful on dry skin; on oily skin they add to the oil already there.",
    evidence: "moderate",
    evidenceNote: "Emollients and occlusives are a well-established way to reduce water loss.",
    cautions: [],
    price: 5,
    color: "#F3DFA6",
  },

  // ---- Brighten and protect ----
  {
    kind: "active",
    id: "nia",
    sku: "BSP-ACT-NIA",
    group: "brighten",
    name: "Niacinamide",
    inci: "Niacinamide (vitamin B3)",
    dose: "5%",
    phase: "water",
    ph: { min: 5.0, max: 7.0 },
    tags: [],
    bestFor: ["oily", "combination", "normal"],
    usage: "am-pm",
    effect:
      "Evens out tone, reduces shine and the look of pores, and strengthens the skin barrier.",
    science:
      "Vitamin B3 supports ceramide production, moderates oil output and slows the transfer of pigment to skin cells. It is stable at pH 5 to 7. In an acidic formula it slowly converts to nicotinic acid, which can cause flushing, so it is not combined with exfoliating acids in one bottle.",
    evidence: "strong",
    evidenceNote: "Multiple controlled trials at 2 to 5% for tone, barrier function and sebum.",
    cautions: [],
    price: 5,
    color: "#D9D4F0",
  },
  {
    kind: "active",
    id: "vitc",
    sku: "BSP-ACT-VITC",
    group: "brighten",
    name: "Vitamin C",
    inci: "Sodium ascorbyl phosphate",
    dose: "3%",
    phase: "water",
    ph: { min: 6.0, max: 7.0 },
    tags: [],
    bestFor: ["normal", "combination", "oily", "dry"],
    usage: "am-pm",
    effect: "Brightens dull skin and helps defend against pollution and UV-driven damage.",
    science:
      "A stable form of vitamin C that the skin converts to ascorbic acid. Pure ascorbic acid breaks down quickly in water; this form holds up, but only at pH 6 to 7. That is why it cannot share a formula with exfoliating acids.",
    evidence: "moderate",
    evidenceNote:
      "Good antioxidant data and some clinical evidence; less studied than pure L-ascorbic acid.",
    cautions: [],
    labNotes: "Protect from light and air. Airless, opaque packaging recommended.",
    price: 8,
    color: "#F6C97A",
  },
  {
    kind: "active",
    id: "gt",
    sku: "BSP-ACT-GT",
    group: "brighten",
    name: "Green Tea Extract",
    inci: "Camellia sinensis leaf extract",
    dose: "2%",
    phase: "water",
    ph: { min: 3.5, max: 5.8 },
    tags: [],
    bestFor: ["oily", "combination", "sensitive", "normal"],
    usage: "am-pm",
    effect: "An antioxidant that calms the look of redness and helps protect skin through the day.",
    science:
      "Green tea polyphenols, mainly EGCG, neutralise free radicals and have anti-inflammatory activity. EGCG is stable in mildly acidic formulas and breaks down as pH rises toward neutral, so it is not paired with ingredients that need pH 6 or higher.",
    evidence: "moderate",
    evidenceNote: "Solid laboratory data and several small human studies.",
    cautions: [],
    price: 4,
    color: "#B9D69A",
  },
  {
    kind: "active",
    id: "vite",
    sku: "BSP-ACT-VITE",
    group: "brighten",
    name: "Vitamin E",
    inci: "Tocopherol (mixed, sunflower-derived)",
    dose: "1%",
    phase: "oil",
    ph: { min: 3.5, max: 8.0 },
    tags: [],
    bestFor: ["dry", "normal"],
    usage: "am-pm",
    effect: "Protects skin lipids from oxidation and adds a conditioned, supple feel.",
    science:
      "An oil-soluble antioxidant that sits in the skin's lipid layer. It also protects the oils in the formula itself from going rancid. It works well alongside vitamin C.",
    evidence: "moderate",
    evidenceNote: "Long-established antioxidant; strongest data is in combination with vitamin C.",
    cautions: [],
    price: 4,
    color: "#F0D48A",
  },

  // ---- Resurface ----
  {
    kind: "active",
    id: "gly",
    sku: "BSP-ACT-GLY",
    group: "resurface",
    name: "Glycolic Acid",
    inci: "Glycolic acid",
    dose: "5%",
    phase: "water",
    ph: { min: 3.5, max: 4.2 },
    tags: ["exfoliant", "strong-exfoliant"],
    bestFor: ["normal", "combination", "oily"],
    usage: "pm",
    effect: "Lifts away dull surface cells for smoother texture and a brighter, more even look.",
    science:
      "The smallest alpha hydroxy acid, so it penetrates most readily. It loosens the bonds between dead surface cells. It only works in an acidic formula (pH 3.5 to 4.2), which sets the pH for everything else in the bottle.",
    evidence: "strong",
    evidenceNote: "Extensively studied for texture, tone and photodamage.",
    cautions: [SUN_CAUTION, "A brief tingle on application is normal. Stop if skin burns or stays red."],
    labNotes:
      "Keep at 10% or below and pH 3.5 or above for consumer leave-on use. US labelling should carry the FDA-recommended sunburn alert for AHA products.",
    price: 6,
    color: "#F4B8B0",
  },
  {
    kind: "active",
    id: "lac",
    sku: "BSP-ACT-LAC",
    group: "resurface",
    name: "Lactic Acid",
    inci: "Lactic acid",
    dose: "5%",
    phase: "water",
    ph: { min: 3.5, max: 4.2 },
    tags: ["exfoliant"],
    bestFor: ["dry", "normal", "combination"],
    usage: "pm",
    effect: "A gentler exfoliant that smooths texture while helping skin hold on to water.",
    science:
      "An alpha hydroxy acid with a larger molecule than glycolic acid, so it works more slowly and with less sting. It is also part of the skin's natural moisturizing factor, so it hydrates as it exfoliates.",
    evidence: "strong",
    evidenceNote: "Well studied for exfoliation and for improving dry, rough skin.",
    cautions: [SUN_CAUTION],
    labNotes: "Same pH and sunburn-alert considerations as glycolic acid.",
    price: 6,
    color: "#F6CFC0",
  },
  {
    kind: "active",
    id: "sal",
    sku: "BSP-ACT-SAL",
    group: "resurface",
    name: "Salicylic Acid",
    inci: "Salicylic acid",
    dose: "2%",
    phase: "water",
    ph: { min: 3.5, max: 4.2 },
    tags: ["exfoliant", "strong-exfoliant", "oil-clearing"],
    bestFor: ["oily", "combination"],
    usage: "pm",
    effect: "Clears out pores and reduces surface oil for a smoother, less congested look.",
    science:
      "A beta hydroxy acid. Unlike AHAs it is attracted to oil, so it works inside the pore lining and dissolves the mix of sebum and dead cells that clogs it. That oil-clearing action is drying on skin that is already dry.",
    evidence: "strong",
    evidenceNote: "Extensively studied at 0.5 to 2% for pores and congestion.",
    cautions: [
      SUN_CAUTION,
      "Do not use if you are allergic to aspirin or other salicylates.",
    ],
    labNotes:
      "Needs a glycol or similar solubiliser in the water phase. In the US, 0.5 to 2% salicylic acid sold with acne claims is an over-the-counter drug; keep claims cosmetic (pores, texture, oil) unless you register it as one.",
    price: 6,
    color: "#F2C6D6",
  },

  // ---- Renew ----
  {
    kind: "active",
    id: "ret",
    sku: "BSP-ACT-RET",
    group: "renew",
    name: "Retinol",
    inci: "Retinol (encapsulated)",
    dose: "0.3%",
    phase: "oil",
    ph: { min: 5.0, max: 7.0 },
    tags: ["retinoid"],
    bestFor: ["normal", "combination", "oily", "dry"],
    usage: "pm",
    effect: "Speeds up skin renewal to soften fine lines, refine texture and even out tone.",
    science:
      "Vitamin A. The skin converts it to retinoic acid, which increases cell turnover and collagen production. It is oil-soluble, breaks down in light, air and acid, and can cause dryness and peeling while skin adjusts.",
    evidence: "strong",
    evidenceNote: "The best-studied cosmetic ingredient for photoaging.",
    cautions: [
      "Night use only. Wear SPF 30 or higher every day.",
      "Do not use while pregnant, trying to conceive or breastfeeding.",
      "Start with two or three nights a week and build up.",
    ],
    labNotes:
      "0.3% is the EU maximum for leave-on face products. Needs airless, opaque packaging and an antioxidant in the oil phase.",
    price: 9,
    color: "#F3D36B",
  },
  {
    kind: "active",
    id: "bak",
    sku: "BSP-ACT-BAK",
    group: "renew",
    name: "Bakuchiol",
    inci: "Bakuchiol",
    dose: "1%",
    phase: "oil",
    ph: { min: 3.5, max: 7.5 },
    tags: [],
    bestFor: ["sensitive", "dry", "normal", "combination"],
    usage: "am-pm",
    effect: "A plant-derived alternative to retinol for lines and uneven tone, without the peeling.",
    science:
      "Extracted from the seeds of the babchi plant. It is not a retinoid but switches on many of the same skin-renewal pathways, and it is stable in light, so it can be used morning and night.",
    evidence: "moderate",
    evidenceNote:
      "A 12-week randomised trial found it improved wrinkles and pigmentation about as well as retinol, with less scaling and stinging. Fewer studies than retinol overall.",
    cautions: [],
    price: 8,
    color: "#D8C3E6",
  },

  // ---- Soothe ----
  {
    kind: "active",
    id: "cica",
    sku: "BSP-ACT-CICA",
    group: "soothe",
    name: "Centella (Cica)",
    inci: "Centella asiatica extract",
    dose: "2%",
    phase: "water",
    ph: { min: 4.0, max: 7.0 },
    tags: [],
    bestFor: ["sensitive", "dry", "combination"],
    usage: "am-pm",
    effect: "Calms visible redness and helps irritated skin settle.",
    science:
      "Centella's active compounds (madecassoside, asiaticoside) reduce inflammatory signalling and support barrier repair.",
    evidence: "moderate",
    evidenceNote: "Long history in wound care; a growing number of cosmetic studies.",
    cautions: [],
    price: 5,
    color: "#BFDDB8",
  },
];

/* ------------------------------------------------------------------ */
/* Boosters: collagen and plant stem cells                             */
/* ------------------------------------------------------------------ */

export const BOOSTERS: Addition[] = [
  {
    kind: "booster",
    id: "col",
    sku: "BSP-BST-COL",
    name: "Collagen Peptides",
    inci: "Hydrolyzed collagen",
    dose: "2%",
    phase: "water",
    ph: { min: 4.0, max: 7.0 },
    tags: [],
    bestFor: ["dry", "normal", "combination"],
    usage: "am-pm",
    effect:
      "Moisture-binding peptides that form a light film, so skin feels smoother, softer and more supple.",
    science:
      "Collagen fragments work at the surface: they hold water and form a flexible film that slows moisture loss. Applied to skin they do not reach the deeper layer or replace the skin's own collagen.",
    evidence: "moderate",
    evidenceNote:
      "Supported for hydration and skin feel. There is little evidence that topical collagen firms skin or reduces wrinkles.",
    cautions: [],
    labNotes:
      "Confirm and declare the source (marine, bovine or fermentation-derived): it decides allergen and vegan labelling. Avoid firming or wrinkle claims based on this ingredient.",
    price: 9,
    color: "#F1D9DC",
  },
  {
    kind: "booster",
    id: "psc",
    sku: "BSP-BST-PSC",
    name: "Plant Stem Cells",
    inci: "Plant cell culture extract",
    dose: "2%",
    phase: "water",
    ph: { min: 4.0, max: 7.5 },
    tags: [],
    bestFor: ["normal", "oily", "dry", "combination", "sensitive"],
    usage: "am-pm",
    effect:
      "An antioxidant-rich extract grown from plant cells, chosen to help defend skin against daily environmental stress.",
    science:
      "Plant cells are grown in culture and their contents extracted, giving a concentrated source of antioxidants and other plant metabolites. They are plant-derived, not human, and do not act as stem cells in skin.",
    evidence: "limited",
    evidenceNote:
      "Evidence is mostly laboratory and supplier studies, with few independent clinical trials.",
    cautions: [],
    labNotes:
      "Replace the INCI with your actual material (for example Malus domestica fruit cell culture extract) and confirm its supplier pH range.",
    price: 12,
    color: "#C7E3C0",
  },
];

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

/** How many actives one formula can hold. */
export const MAX_ACTIVES = 3;

/** Two windows must overlap by at least this many pH units to share a formula. */
export const MIN_PH_OVERLAP = 0.2;

/**
 * Ingredients and bases with these tags are greyed out for a skin type.
 * To block something else for a skin type, add the tag to that item in the
 * lists above, or add a new rule here.
 */
export const SKIN_BLOCKS: Record<SkinType, SkinBlock[]> = {
  normal: [],
  combination: [],
  oily: [
    {
      tag: "rich",
      reason:
        "Too rich for oily skin. Heavy butters and occlusive lipids add to the oil already there and can leave skin greasy or congested.",
    },
  ],
  dry: [
    {
      tag: "oil-clearing",
      reason:
        "Not suited to dry skin. It strips oil that dry skin needs to keep. Lactic acid is the gentler choice.",
    },
  ],
  sensitive: [
    {
      tag: "strong-exfoliant",
      reason: "Too strong for sensitive skin. It is likely to sting and cause redness.",
    },
    {
      tag: "retinoid",
      reason:
        "Retinol often irritates sensitive skin. Bakuchiol works on the same concerns far more gently.",
    },
  ],
};

/** Ingredient types that cannot share a formula, whatever the pH. */
export const PAIR_CONFLICTS: PairConflict[] = [
  {
    a: "retinoid",
    b: "exfoliant",
    reason:
      "Retinol and an exfoliating acid in one formula over-strip skin, and the acid breaks retinol down.",
  },
  {
    a: "exfoliant",
    b: "exfoliant",
    reason: "One exfoliating acid per formula. Stacking them raises the risk of irritation.",
  },
];

/* ------------------------------------------------------------------ */
/* Purchase plans (placeholders until Shopify selling plans are live)  */
/* ------------------------------------------------------------------ */

export const PLANS: Plan[] = [
  {
    id: "once",
    name: "One-time purchase",
    detail: "A one-month supply, made to order.",
    discountPct: 0,
    deliveries: 1,
    shopifyNameIncludes: [],
  },
  {
    id: "quarter",
    name: "3-month plan",
    detail: "A fresh batch each month for 3 months.",
    discountPct: 10,
    deliveries: 3,
    shopifyNameIncludes: ["3-month"],
  },
  {
    id: "annual",
    name: "Annual plan",
    detail: "A fresh batch each month for 12 months.",
    discountPct: 20,
    deliveries: 12,
    shopifyNameIncludes: ["annual"],
  },
];
