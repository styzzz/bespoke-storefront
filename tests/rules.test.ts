import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACTIVES,
  ADDITIONS,
  BASES,
  BOOSTERS,
  MAX_ACTIVES,
  PLANS,
  SKIN_TYPES,
  basesFor,
  getAddition,
  getBase,
} from "../lib/catalog";
import type { ProductType, Selection, SkinType } from "../lib/catalog";
import { formulaCode, formulaSummary } from "../lib/formula";
import { formatMoney, quote } from "../lib/pricing";
import {
  evaluateAddition,
  evaluateBase,
  formulaPh,
  isComplete,
  sanitize,
  selectedAdditions,
} from "../lib/rules";

function sel(partial: Partial<Selection>): Selection {
  return { productType: null, skinType: null, baseId: null, activeIds: [], boosterIds: [], ...partial };
}
const add = (id: string) => {
  const a = getAddition(id);
  assert.ok(a, `unknown addition ${id}`);
  return a;
};
const base = (id: string) => {
  const b = getBase(id);
  assert.ok(b, `unknown base ${id}`);
  return b;
};

describe("catalog integrity", () => {
  it("has unique ids and SKUs", () => {
    const ids = [...BASES, ...ADDITIONS].map((x) => x.id);
    const skus = [...BASES, ...ADDITIONS].map((x) => x.sku);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(skus).size, skus.length);
  });

  it("offers three to four bases per product type", () => {
    for (const t of ["serum", "moisturizer"] as ProductType[]) {
      const n = basesFor(t).length;
      assert.ok(n >= 3 && n <= 4, `${t} has ${n} bases`);
    }
  });

  it("has sane pH windows and positive prices", () => {
    for (const b of BASES) {
      assert.ok(b.price > 0);
      if (b.ph) assert.ok(b.ph.min < b.ph.max);
      assert.ok(b.phases.length > 0);
    }
    for (const a of ADDITIONS) {
      assert.ok(a.price > 0);
      assert.ok(a.ph.min < a.ph.max);
    }
  });

  it("gives every skin type at least one available and one recommended base per product type", () => {
    for (const s of SKIN_TYPES) {
      for (const t of ["serum", "moisturizer"] as ProductType[]) {
        const verdicts = basesFor(t).map((b) => evaluateBase(b, sel({ productType: t, skinType: s.id })));
        assert.ok(verdicts.some((v) => v.status !== "blocked"), `${s.id}/${t} has no base`);
        assert.ok(verdicts.some((v) => v.status === "recommended"), `${s.id}/${t} has no recommended base`);
      }
    }
  });

  it("lets every skin type and base take at least one active", () => {
    for (const s of SKIN_TYPES) {
      for (const b of BASES) {
        const state = sel({ productType: b.productType, skinType: s.id, baseId: b.id });
        if (evaluateBase(b, state).status === "blocked") continue;
        const open = ACTIVES.filter((a) => evaluateAddition(a, state).status !== "blocked");
        assert.ok(open.length >= 2, `${s.id} + ${b.id} has only ${open.length} actives`);
      }
    }
  });

  it("every blocked verdict explains itself", () => {
    for (const s of SKIN_TYPES) {
      for (const b of BASES) {
        const state = sel({ productType: b.productType, skinType: s.id, baseId: b.id });
        for (const a of ADDITIONS) {
          const v = evaluateAddition(a, state);
          if (v.status === "blocked") assert.ok(v.reason && v.reason.length > 20, `${a.id} on ${b.id}`);
        }
      }
    }
  });
});

describe("skin type rules", () => {
  it("greys out rich bases and rich extras for oily skin choosing a moisturizer", () => {
    const state = sel({ productType: "moisturizer", skinType: "oily", baseId: "mst-lotion" });
    assert.equal(evaluateBase(base("mst-butter"), state).status, "blocked");
    assert.equal(evaluateAddition(add("lipid"), state).status, "blocked");
    assert.match(evaluateAddition(add("lipid"), state).reason ?? "", /oily skin/);
    // Lightweight hydration stays open to oily skin.
    assert.notEqual(evaluateAddition(add("ha"), state).status, "blocked");
    assert.equal(evaluateBase(base("mst-gel"), state).status, "recommended");
  });

  it("keeps the same rich options open for dry skin", () => {
    const state = sel({ productType: "moisturizer", skinType: "dry", baseId: "mst-butter" });
    assert.equal(evaluateBase(base("mst-butter"), state).status, "recommended");
    assert.equal(evaluateAddition(add("lipid"), state).status, "recommended");
  });

  it("blocks strong acids and retinol for sensitive skin but allows bakuchiol", () => {
    const state = sel({ productType: "serum", skinType: "sensitive", baseId: "ser-milk" });
    assert.equal(evaluateAddition(add("gly"), state).status, "blocked");
    assert.equal(evaluateAddition(add("sal"), state).status, "blocked");
    assert.equal(evaluateAddition(add("ret"), state).status, "blocked");
    assert.equal(evaluateAddition(add("bak"), state).status, "recommended");
    assert.notEqual(evaluateAddition(add("lac"), state).status, "blocked");
  });

  it("blocks salicylic acid for dry skin", () => {
    const state = sel({ productType: "serum", skinType: "dry", baseId: "ser-milk" });
    assert.equal(evaluateAddition(add("sal"), state).status, "blocked");
    assert.equal(evaluateAddition(add("lac"), state).status, "recommended");
  });
});

describe("phase rules", () => {
  it("blocks oil-soluble actives in a water-only base", () => {
    const state = sel({ productType: "serum", skinType: "normal", baseId: "ser-aloe" });
    for (const id of ["ret", "bak", "vite", "cer", "lipid"]) {
      const v = evaluateAddition(add(id), state);
      assert.equal(v.status, "blocked", id);
      assert.match(v.reason ?? "", /oil-soluble/);
    }
    assert.notEqual(evaluateAddition(add("ha"), state).status, "blocked");
  });

  it("blocks water-soluble actives and both boosters in the oil serum", () => {
    const state = sel({ productType: "serum", skinType: "dry", baseId: "ser-squalane" });
    for (const id of ["ha", "nia", "vitc", "gly", "col", "psc"]) {
      const v = evaluateAddition(add(id), state);
      assert.equal(v.status, "blocked", id);
      assert.match(v.reason ?? "", /water-soluble/);
    }
    assert.notEqual(evaluateAddition(add("bak"), state).status, "blocked");
    assert.equal(formulaPh(base("ser-squalane"), [add("bak")]), null);
  });
});

describe("pH rules", () => {
  it("blocks acids in bases held at a higher pH", () => {
    for (const id of ["ser-oat", "mst-butter", "mst-barrier"]) {
      const b = base(id);
      const state = sel({ productType: b.productType, skinType: "normal", baseId: id });
      const v = evaluateAddition(add("gly"), state);
      assert.equal(v.status, "blocked", id);
      assert.match(v.reason ?? "", /held at pH/);
    }
  });

  it("blocks niacinamide and vitamin C once an acid is chosen, and names the acid", () => {
    const state = sel({ productType: "serum", skinType: "normal", baseId: "ser-aloe", activeIds: ["gly"] });
    for (const id of ["nia", "vitc"]) {
      const v = evaluateAddition(add(id), state);
      assert.equal(v.status, "blocked", id);
      assert.match(v.reason ?? "", /Remove Glycolic Acid/);
    }
    // These tolerate the acid's pH.
    for (const id of ["ha", "gt", "cica", "col", "psc"]) {
      assert.notEqual(evaluateAddition(add(id), state).status, "blocked", id);
    }
  });

  it("blocks the acid when niacinamide was chosen first", () => {
    const state = sel({ productType: "serum", skinType: "normal", baseId: "ser-aloe", activeIds: ["nia"] });
    assert.equal(evaluateAddition(add("gly"), state).status, "blocked");
  });

  it("keeps green tea and vitamin C apart", () => {
    const state = sel({ productType: "serum", skinType: "normal", baseId: "ser-aloe", activeIds: ["vitc"] });
    assert.equal(evaluateAddition(add("gt"), state).status, "blocked");
    // Niacinamide works with either.
    assert.notEqual(evaluateAddition(add("nia"), state).status, "blocked");
  });

  it("narrows the formula pH as ingredients are added", () => {
    const ph = formulaPh(base("ser-aloe"), [add("nia"), add("vitc")]);
    assert.deepEqual(ph, { min: 6.0, max: 7.0 });
    const acid = formulaPh(base("ser-aloe"), [add("gly"), add("col")]);
    assert.deepEqual(acid, { min: 4.0, max: 4.2 });
  });

  it("never lets a formula end up without a workable pH", () => {
    // Greedily add everything that is allowed, in every order of first pick.
    for (const b of BASES) {
      for (const first of ADDITIONS) {
        let state = sel({ productType: b.productType, skinType: "normal", baseId: b.id });
        for (const a of [first, ...ADDITIONS]) {
          if (selectedAdditions(state).some((x) => x.id === a.id)) continue;
          if (evaluateAddition(a, state).status === "blocked") continue;
          state =
            a.kind === "active"
              ? { ...state, activeIds: [...state.activeIds, a.id] }
              : { ...state, boosterIds: [...state.boosterIds, a.id] };
        }
        const ph = formulaPh(b, selectedAdditions(state));
        if (ph) assert.ok(ph.max - ph.min >= 0.19, `${b.id} starting ${first.id}: ${JSON.stringify(ph)}`);
        assert.ok(state.activeIds.length <= MAX_ACTIVES);
      }
    }
  });
});

describe("conflicts and limits", () => {
  it("allows only one exfoliating acid", () => {
    const state = sel({ productType: "serum", skinType: "oily", baseId: "ser-aloe", activeIds: ["sal"] });
    const v = evaluateAddition(add("gly"), state);
    assert.equal(v.status, "blocked");
    assert.match(v.reason ?? "", /One exfoliating acid/);
  });

  it("keeps retinol and acids apart in both directions", () => {
    const a = sel({ productType: "serum", skinType: "normal", baseId: "ser-milk", activeIds: ["ret"] });
    assert.match(evaluateAddition(add("lac"), a).reason ?? "", /Remove Retinol/);
    const b = sel({ productType: "serum", skinType: "normal", baseId: "ser-milk", activeIds: ["lac"] });
    assert.match(evaluateAddition(add("ret"), b).reason ?? "", /Remove Lactic Acid/);
  });

  it("caps actives but never blocks ones already chosen", () => {
    const state = sel({
      productType: "serum",
      skinType: "normal",
      baseId: "ser-milk",
      activeIds: ["ha", "nia", "vite"],
    });
    assert.equal(MAX_ACTIVES, 3);
    assert.match(evaluateAddition(add("bak"), state).reason ?? "", /up to 3 actives/);
    assert.notEqual(evaluateAddition(add("ha"), state).status, "blocked");
    // Boosters do not count toward the cap.
    assert.notEqual(evaluateAddition(add("col"), state).status, "blocked");
  });

  it("allows collagen and plant stem cells together", () => {
    const state = sel({ productType: "moisturizer", skinType: "dry", baseId: "mst-butter", boosterIds: ["col"] });
    assert.notEqual(evaluateAddition(add("psc"), state).status, "blocked");
    assert.equal(BOOSTERS.length, 2);
  });

  it("asks for a base before any addition", () => {
    const v = evaluateAddition(add("ha"), sel({ productType: "serum", skinType: "normal" }));
    assert.equal(v.status, "blocked");
    assert.equal(v.reason, "Choose a base first.");
  });
});

describe("sanitize", () => {
  it("drops choices that stop fitting when the base changes, and says why", () => {
    const { selection, removed } = sanitize(
      sel({ productType: "serum", skinType: "normal", baseId: "ser-squalane", activeIds: ["ha", "bak"], boosterIds: ["col"] }),
    );
    assert.deepEqual(selection.activeIds, ["bak"]);
    assert.deepEqual(selection.boosterIds, []);
    assert.deepEqual(removed.map((r) => r.id).sort(), ["col", "ha"]);
    assert.ok(removed.every((r) => r.reason.length > 0));
  });

  it("drops a base that the new skin type blocks", () => {
    const { selection, removed } = sanitize(
      sel({ productType: "moisturizer", skinType: "oily", baseId: "mst-butter", activeIds: ["ha"] }),
    );
    assert.equal(selection.baseId, null);
    assert.deepEqual(selection.activeIds, []);
    assert.equal(removed[0].id, "mst-butter");
  });

  it("rejects a tampered formula: wrong product type, conflicts, duplicates, too many actives", () => {
    const wrongType = sanitize(sel({ productType: "serum", skinType: "normal", baseId: "mst-lotion", activeIds: ["ha"] }));
    assert.equal(wrongType.selection.baseId, null);

    const tampered = sanitize(
      sel({
        productType: "serum",
        skinType: "sensitive",
        baseId: "ser-milk",
        activeIds: ["ha", "ha", "gly", "ret", "nia", "bak", "cica", "nope"],
        boosterIds: ["psc", "psc"],
      }),
    );
    assert.deepEqual(tampered.selection.activeIds, ["ha", "nia", "bak"]);
    assert.deepEqual(tampered.selection.boosterIds, ["psc"]);
    assert.ok(tampered.removed.some((r) => r.id === "gly"));
    assert.ok(tampered.removed.some((r) => r.id === "ret"));
    assert.ok(tampered.removed.some((r) => r.id === "cica"));
  });

  it("leaves a valid formula untouched", () => {
    const input = sel({
      productType: "moisturizer",
      skinType: "combination",
      baseId: "mst-lotion",
      activeIds: ["ha", "nia", "vitc"],
      boosterIds: ["col", "psc"],
    });
    const { selection, removed } = sanitize(input);
    assert.deepEqual(selection, input);
    assert.equal(removed.length, 0);
    assert.ok(isComplete(selection));
  });
});

describe("pricing and formula text", () => {
  const formula = sel({
    productType: "serum",
    skinType: "oily",
    baseId: "ser-aloe",
    activeIds: ["ha", "nia"],
    boosterIds: ["col", "psc"],
  });

  it("adds the base and every addition", () => {
    const q = quote(formula, "once");
    assert.equal(q.subtotalCents, (28 + 6 + 5 + 9 + 12) * 100);
    assert.equal(q.perDeliveryCents, q.subtotalCents);
    assert.equal(q.lines.length, 5);
  });

  it("applies plan discounts per delivery", () => {
    const quarter = quote(formula, "quarter");
    assert.equal(quarter.discountPct, 10);
    assert.equal(quarter.perDeliveryCents, 5400);
    assert.equal(quarter.savingsPerDeliveryCents, 600);
    assert.equal(quarter.deliveries, 3);
    const annual = quote(formula, "annual");
    assert.equal(annual.perDeliveryCents, 4800);
    assert.equal(annual.deliveries, 12);
  });

  it("prefers live Shopify prices and discounts when present", () => {
    const q = quote(formula, "quarter", {
      currency: "USD",
      prices: { "BSP-BASE-SER-ALOE": 3100, "BSP-ACT-HA": 750 },
      planDiscounts: { quarter: 15 },
    });
    assert.equal(q.subtotalCents, 3100 + 750 + 500 + 900 + 1200);
    assert.equal(q.discountPct, 15);
    assert.equal(q.perDeliveryCents, Math.round((q.subtotalCents * 85) / 100));
  });

  it("formats money and describes the formula", () => {
    assert.equal(formatMoney(6000), "$60");
    assert.equal(formatMoney(5450), "$54.50");
    assert.equal(formulaCode(formula), "SER-ALOE/OILY/HA+NIA/COL+PSC");
    assert.equal(
      formulaSummary(formula),
      "Aloe Water-Gel with Hyaluronic Acid 1%, Niacinamide 5%, Collagen Peptides 2% and Plant Stem Cells 2%",
    );
    assert.equal(PLANS.length, 3);
  });
});

describe("every skin type can finish a formula", () => {
  it("has a complete path for all skin types and product types", () => {
    for (const s of SKIN_TYPES.map((x) => x.id) as SkinType[]) {
      for (const t of ["serum", "moisturizer"] as ProductType[]) {
        const b = basesFor(t).find((x) => evaluateBase(x, sel({ productType: t, skinType: s })).status === "recommended");
        assert.ok(b);
        assert.ok(isComplete(sel({ productType: t, skinType: s, baseId: b.id })));
      }
    }
  });
});
