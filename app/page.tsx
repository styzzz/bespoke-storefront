import Link from "next/link";

import { FormulaColumn } from "@/components/FormulaColumn";
import type { ColumnLayer } from "@/components/FormulaColumn";
import { PhScale } from "@/components/PhScale";
import { ACTIVES, BASES, BOOSTERS, MAX_ACTIVES, getAddition, getBase } from "@/lib/catalog";
import type { Addition } from "@/lib/catalog";
import { formulaPh } from "@/lib/rules";

// The example shown in the hero. Any valid combination from the catalog works here.
const EXAMPLE = { baseId: "ser-milk", additionIds: ["ha", "nia", "vitc", "col", "psc"] };

export default function HomePage() {
  const base = getBase(EXAMPLE.baseId);
  const additions = EXAMPLE.additionIds
    .map((id) => getAddition(id))
    .filter((a): a is Addition => Boolean(a));
  const layers: ColumnLayer[] = base
    ? [
        { id: base.id, name: base.name, color: base.color, kind: "base" },
        ...additions.map(
          (a): ColumnLayer => ({ id: a.id, name: a.name, dose: a.dose, color: a.color, kind: a.kind }),
        ),
      ]
    : [];

  return (
    <main className="page page--home">
      <section className="hero">
        <div className="hero__copy">
          <h1 className="hero__title">Your skincare, built to your own formula.</h1>
          <p className="hero__lead">
            Choose a base, add up to {MAX_ACTIVES} actives, and finish with collagen or plant stem
            cells. We check every combination, then make your one-month supply to order.
          </p>
          <div className="hero__actions">
            <Link href="/build" className="btn btn--primary btn--large">
              Build your formula
            </Link>
            <Link href="/ingredients" className="text-link">
              Browse the ingredients
            </Link>
          </div>
        </div>
        <figure className="hero__bench">
          <figcaption className="hero__caption">An example serum</figcaption>
          <FormulaColumn layers={layers} volume={base ? `${base.sizeMl} ml` : undefined} animate />
          <PhScale range={formulaPh(base, additions)} />
        </figure>
      </section>

      <section className="band" aria-labelledby="how-title">
        <h2 id="how-title" className="band__title">
          How it works
        </h2>
        <ol className="sequence">
          <li>
            <h3>Say what you want</h3>
            <p>Pick a serum or a moisturizer, then tell us your skin type.</p>
          </li>
          <li>
            <h3>Choose a base</h3>
            <p>
              {BASES.length} bases, from a weightless aloe gel to a mango butter cream. The base sets
              the texture and decides what can be added.
            </p>
          </li>
          <li>
            <h3>Add actives and extras</h3>
            <p>
              Up to {MAX_ACTIVES} of {ACTIVES.length} actives, plus{" "}
              {BOOSTERS.map((b) => b.name.toLowerCase()).join(", ")} or both.
            </p>
          </li>
          <li>
            <h3>See your price and order</h3>
            <p>Buy a one-month supply once, or save with a 3-month or annual plan.</p>
          </li>
        </ol>
      </section>

      <section className="band band--rules" aria-labelledby="rules-title">
        <div className="band__intro">
          <h2 id="rules-title" className="band__title">
            Why some options turn grey
          </h2>
          <p>
            Not everything belongs in the same bottle. As you build, anything that would not work is
            greyed out, with the reason next to it.
          </p>
        </div>
        <dl className="rules">
          <div>
            <dt>It has to dissolve</dt>
            <dd>
              Retinol and bakuchiol dissolve in oil. Hyaluronic acid and niacinamide dissolve in
              water. A base can only carry what it can dissolve.
            </dd>
          </div>
          <div>
            <dt>One bottle, one pH</dt>
            <dd>
              Glycolic acid works near pH 4. Niacinamide and vitamin C need pH 5 to 7. Choose one and
              the others step aside.
            </dd>
          </div>
          <div>
            <dt>It has to suit your skin</dt>
            <dd>
              Heavy butters are held back from oily skin. Strong acids and retinol are held back from
              sensitive skin.
            </dd>
          </div>
        </dl>
      </section>

      <section className="closing">
        <h2 className="closing__title">Start with a base. The rest follows.</h2>
        <Link href="/build" className="btn btn--primary btn--large">
          Build your formula
        </Link>
      </section>
    </main>
  );
}
