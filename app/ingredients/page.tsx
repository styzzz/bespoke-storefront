import type { Metadata } from "next";
import Link from "next/link";

import {
  ACTIVES,
  ACTIVE_GROUPS,
  BOOSTERS,
  MAX_ACTIVES,
  PAIR_CONFLICTS,
  PRODUCT_TYPES,
  SKIN_BLOCKS,
  SKIN_TYPES,
  basesFor,
  getSkin,
} from "@/lib/catalog";
import type { Addition, Base, Evidence, SkinType, Tag } from "@/lib/catalog";
import { formatPh } from "@/lib/rules";

export const metadata: Metadata = {
  title: "Ingredient library",
  description:
    "What each base, active and booster does, how well it is supported by evidence, and what it can and cannot be combined with.",
};

const EVIDENCE: Record<Evidence, string> = {
  strong: "Well established",
  moderate: "Good evidence",
  limited: "Early evidence",
};

const skinNames = (ids: SkinType[]) =>
  ids.length === SKIN_TYPES.length
    ? "All skin types"
    : ids.map((id) => getSkin(id)?.name ?? id).join(", ");

const everything: (Base | Addition)[] = [
  ...PRODUCT_TYPES.flatMap((t) => basesFor(t.id)),
  ...ACTIVES,
  ...BOOSTERS,
];
const namesWithTag = (tag: Tag) =>
  everything
    .filter((item) => item.tags.includes(tag))
    .map((item) => item.name)
    .join(", ");

function BaseEntry({ base }: { base: Base }) {
  return (
    <article className="entry" id={base.id}>
      <header className="entry__head">
        <h3 className="entry__name">{base.name}</h3>
        <p className="entry__inci">{base.keyIngredients}</p>
      </header>
      <p className="entry__effect">{base.summary}</p>
      <p className="entry__science">{base.science}</p>
      <dl className="entry__facts">
        <div>
          <dt>Carries</dt>
          <dd>
            {base.phases.length === 2
              ? "Water-soluble and oil-soluble ingredients"
              : `${base.phases[0] === "water" ? "Water" : "Oil"}-soluble ingredients only`}
          </dd>
        </div>
        <div>
          <dt>pH</dt>
          <dd>{base.ph ? formatPh(base.ph) : "None (no water)"}</dd>
        </div>
        <div>
          <dt>Best for</dt>
          <dd>{skinNames(base.bestFor)}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{base.sizeMl} ml</dd>
        </div>
      </dl>
    </article>
  );
}

function AdditionEntry({ item }: { item: Addition }) {
  return (
    <article className="entry" id={item.id}>
      <header className="entry__head">
        <h3 className="entry__name">
          {item.name} <span className="entry__dose">{item.dose}</span>
        </h3>
        <p className="entry__inci">{item.inci}</p>
      </header>
      <p className="entry__effect">{item.effect}</p>
      <p className="entry__science">{item.science}</p>
      <dl className="entry__facts">
        <div>
          <dt>Evidence</dt>
          <dd>
            <span className={`evidence evidence--${item.evidence}`}>{EVIDENCE[item.evidence]}</span>{" "}
            {item.evidenceNote}
          </dd>
        </div>
        <div>
          <dt>Dissolves in</dt>
          <dd>{item.phase === "water" ? "Water" : "Oil"}</dd>
        </div>
        <div>
          <dt>Works at pH</dt>
          <dd>{formatPh(item.ph)}</dd>
        </div>
        <div>
          <dt>Best for</dt>
          <dd>{skinNames(item.bestFor)}</dd>
        </div>
        <div>
          <dt>Use</dt>
          <dd>{item.usage === "pm" ? "At night only" : "Morning and night"}</dd>
        </div>
        {item.cautions.length ? (
          <div>
            <dt>Take care</dt>
            <dd>
              <ul>
                {item.cautions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

export default function IngredientsPage() {
  return (
    <main className="page page--library">
      <header className="page__intro">
        <h1 className="page__title">Ingredient library</h1>
        <p className="page__lead">
          What each ingredient does, how well it is supported by evidence, and what it can share a
          bottle with. This is the same information the builder uses to check your formula.
        </p>
        <nav className="toc" aria-label="On this page">
          <a href="#bases">Bases</a>
          <a href="#actives">Actives</a>
          <a href="#boosters">Collagen and plant stem cells</a>
          <a href="#rules">How formulas are checked</a>
        </nav>
      </header>

      <section id="bases" className="library">
        <h2 className="library__title">Bases</h2>
        {PRODUCT_TYPES.map((type) => (
          <div key={type.id} className="library__group">
            <h3 className="library__subtitle">
              {type.name} bases <span>{type.size}</span>
            </h3>
            <div className="entries">
              {basesFor(type.id).map((b) => (
                <BaseEntry key={b.id} base={b} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="actives" className="library">
        <h2 className="library__title">Actives</h2>
        {ACTIVE_GROUPS.map((group) => (
          <div key={group.id} className="library__group">
            <h3 className="library__subtitle">
              {group.name} <span>{group.description}</span>
            </h3>
            <div className="entries">
              {ACTIVES.filter((a) => a.group === group.id).map((a) => (
                <AdditionEntry key={a.id} item={a} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="boosters" className="library">
        <h2 className="library__title">Collagen and plant stem cells</h2>
        <div className="entries">
          {BOOSTERS.map((a) => (
            <AdditionEntry key={a.id} item={a} />
          ))}
        </div>
      </section>

      <section id="rules" className="library library--rules">
        <h2 className="library__title">How formulas are checked</h2>
        <dl className="rulebook">
          <div>
            <dt>Solubility</dt>
            <dd>
              Each ingredient dissolves in water or in oil. A base with no oil cannot carry
              oil-soluble ingredients, and a base with no water cannot carry water-soluble ones.
            </dd>
          </div>
          <div>
            <dt>pH</dt>
            <dd>
              Every ingredient in a water-containing formula shares one pH. Two ingredients can be
              combined only if their working pH ranges overlap, and the base can be held in that
              range.
            </dd>
          </div>
          {PAIR_CONFLICTS.map((c) => (
            <div key={`${c.a}-${c.b}`}>
              <dt>{c.a === c.b ? "One exfoliating acid" : "Retinol and acids"}</dt>
              <dd>{c.reason}</dd>
            </div>
          ))}
          {SKIN_TYPES.flatMap((s) =>
            SKIN_BLOCKS[s.id].map((rule) => (
              <div key={`${s.id}-${rule.tag}`}>
                <dt>{s.name} skin</dt>
                <dd>
                  <strong>{namesWithTag(rule.tag)}:</strong> {rule.reason}
                </dd>
              </div>
            )),
          )}
          <div>
            <dt>Room in the bottle</dt>
            <dd>
              A formula holds up to {MAX_ACTIVES} actives, plus collagen peptides, plant stem cells
              or both.
            </dd>
          </div>
        </dl>
        <p className="library__cta">
          <Link href="/build" className="btn btn--primary">
            Build your formula
          </Link>
        </p>
      </section>
    </main>
  );
}
