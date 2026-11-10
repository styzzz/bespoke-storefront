"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  ACTIVES,
  ACTIVE_GROUPS,
  BOOSTERS,
  MAX_ACTIVES,
  PLANS,
  PRODUCT_TYPES,
  SKIN_TYPES,
  basesFor,
  getBase,
  getSkin,
} from "@/lib/catalog";
import type { Addition, Base, PlanId, ProductType, Selection, SkinType } from "@/lib/catalog";
import { PATCH_TEST_NOTE, PLAN_BILLING_NOTE, SHOW_PRICES_WHILE_BUILDING } from "@/lib/config";
import { formulaCode, productName } from "@/lib/formula";
import { formatMoney, itemCents, quote } from "@/lib/pricing";
import type { LiveView } from "@/lib/pricing";
import {
  EMPTY_SELECTION,
  evaluateAddition,
  evaluateBase,
  formulaCautions,
  formulaPh,
  formulaUsage,
  isComplete,
  sanitize,
  selectedAdditions,
} from "@/lib/rules";
import type { Removal, Verdict } from "@/lib/rules";

import { FormulaColumn } from "./FormulaColumn";
import type { ColumnLayer } from "./FormulaColumn";
import { PhScale } from "./PhScale";

export type StoreMode = "demo" | "live" | "store-error";

interface Props {
  /** Prices and plans read from Shopify. null in demo mode or on error. */
  live: LiveView | null;
  mode: StoreMode;
}

type StepId = "type" | "skin" | "base" | "actives" | "boosters";

type CheckoutState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "demo" }
  | { status: "error"; message: string };

interface CheckoutResponse {
  mode?: "demo" | "live";
  checkoutUrl?: string;
  error?: string;
}

const STORAGE_KEY = "bespoke:v1";
const UNAVAILABLE: Verdict = { status: "blocked", reason: "Temporarily unavailable." };

export function Builder({ live, mode }: Props) {
  const [sel, setSel] = useState<Selection>(EMPTY_SELECTION);
  const [planId, setPlanId] = useState<PlanId>("once");
  const [reviewed, setReviewed] = useState(false);
  const [notice, setNotice] = useState<{ step: StepId; removed: Removal[] } | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState>({ status: "idle" });
  const [restored, setRestored] = useState(false);
  const scrollTarget = useRef<string | null>(null);

  // Bring back an unfinished formula after a reload or a visit to another page.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { sel?: Selection; planId?: PlanId; reviewed?: boolean };
        if (saved.sel) {
          const clean = sanitize({ ...EMPTY_SELECTION, ...saved.sel });
          setSel(clean.selection);
          if (saved.planId && PLANS.some((p) => p.id === saved.planId)) setPlanId(saved.planId);
          setReviewed(Boolean(saved.reviewed) && isComplete(clean.selection));
        }
      }
    } catch {
      // Storage is unavailable or the saved value is unreadable: start fresh.
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sel, planId, reviewed }));
    } catch {
      // Nothing to do: the builder works without storage.
    }
  }, [sel, planId, reviewed, restored]);

  // Move to the step that just opened.
  useEffect(() => {
    const id = scrollTarget.current;
    if (!id) return;
    scrollTarget.current = null;
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });

  const base = getBase(sel.baseId);
  const additions = useMemo(() => selectedAdditions(sel), [sel]);
  const skin = getSkin(sel.skinType);
  const complete = isComplete(sel);
  const unavailable = useMemo(() => new Set(live?.unavailableSkus ?? []), [live]);

  const plans = useMemo(
    () => (live ? PLANS.filter((p) => live.availablePlans.includes(p.id)) : PLANS),
    [live],
  );
  const activePlanId: PlanId = plans.some((p) => p.id === planId) ? planId : "once";
  const pricing = live?.pricing ?? null;
  const price = quote(sel, activePlanId, pricing);

  const layers: ColumnLayer[] = base
    ? [
        { id: base.id, name: base.name, color: base.color, kind: "base" },
        ...additions.map(
          (a): ColumnLayer => ({ id: a.id, name: a.name, dose: a.dose, color: a.color, kind: a.kind }),
        ),
      ]
    : [];
  const ph = formulaPh(base, additions);
  const cautions = formulaCautions(sel);

  /* ------------------------------ actions ------------------------------ */

  function apply(next: Selection, step: StepId) {
    const result = sanitize(next);
    setSel(result.selection);
    setNotice(result.removed.length ? { step, removed: result.removed } : null);
    setCheckout({ status: "idle" });
    if (!isComplete(result.selection)) setReviewed(false);
  }

  function chooseType(productType: ProductType) {
    if (productType === sel.productType) return;
    apply({ ...sel, productType, baseId: null, activeIds: [], boosterIds: [] }, "type");
    scrollTarget.current = sel.skinType ? "step-base" : "step-skin";
  }

  function chooseSkin(skinType: SkinType) {
    if (skinType === sel.skinType) return;
    const hadBase = Boolean(sel.baseId);
    apply({ ...sel, skinType }, "skin");
    if (!hadBase) scrollTarget.current = "step-base";
  }

  function chooseBase(b: Base) {
    if (b.id === sel.baseId) return;
    const first = !sel.baseId;
    apply({ ...sel, baseId: b.id }, "base");
    if (first) scrollTarget.current = "step-actives";
  }

  function toggle(a: Addition) {
    const flip = (ids: string[]) => (ids.includes(a.id) ? ids.filter((id) => id !== a.id) : [...ids, a.id]);
    if (a.kind === "active") apply({ ...sel, activeIds: flip(sel.activeIds) }, "actives");
    else apply({ ...sel, boosterIds: flip(sel.boosterIds) }, "boosters");
  }

  function review() {
    if (!complete) return;
    setReviewed(true);
    scrollTarget.current = "review";
  }

  async function startCheckout() {
    if (!complete || checkout.status === "working") return;
    setCheckout({ status: "working" });
    const fallback = "We couldn't start checkout. Try again in a moment.";
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection: sel, planId: activePlanId }),
      });
      const data = (await response.json()) as CheckoutResponse;
      if (response.ok && data.mode === "live" && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      if (response.ok && data.mode === "demo") {
        setCheckout({ status: "demo" });
        return;
      }
      setCheckout({ status: "error", message: data.error ?? fallback });
    } catch {
      setCheckout({ status: "error", message: fallback });
    }
  }

  /* ------------------------------ verdicts ------------------------------ */

  const baseVerdict = (b: Base): Verdict => (unavailable.has(b.sku) ? UNAVAILABLE : evaluateBase(b, sel));
  const additionVerdict = (a: Addition): Verdict =>
    unavailable.has(a.sku) ? UNAVAILABLE : evaluateAddition(a, sel);
  const priceTag = (sku: string, fallback: number, plus: boolean) =>
    SHOW_PRICES_WHILE_BUILDING
      ? `${plus ? "+" : ""}${formatMoney(itemCents(sku, fallback, pricing), price.currency)}`
      : undefined;
  const fitLabel = skin ? `Suits ${skin.name.toLowerCase()} skin` : undefined;

  const noticeFor = (step: StepId) =>
    notice && notice.step === step ? (
      <div className="notice" role="status">
        <p className="notice__title">
          {notice.removed.length === 1 ? "One choice was removed" : "Some choices were removed"}
        </p>
        <ul>
          {notice.removed.map((r) => (
            <li key={r.id}>
              <strong>{r.name}.</strong> {r.reason}
            </li>
          ))}
        </ul>
        <button type="button" className="link-button" onClick={() => setNotice(null)}>
          Dismiss
        </button>
      </div>
    ) : null;

  /* ------------------------------ render ------------------------------ */

  return (
    <div className={`builder${base ? " builder--has-bar" : ""}`}>
      <div className="builder__steps">
        {mode === "demo" ? (
          <p className="builder__mode">
            Preview mode. Prices are placeholders and checkout is not connected yet.
          </p>
        ) : null}

        <Step id="step-type" number={1} title="What are we making?">
          <div className="tiles tiles--two" role="radiogroup" aria-label="Product type">
            {PRODUCT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={sel.productType === t.id}
                className={`tile${sel.productType === t.id ? " is-selected" : ""}`}
                onClick={() => chooseType(t.id)}
              >
                <span className="tile__name">{t.name}</span>
                <span className="tile__text">{t.description}</span>
                <span className="tile__meta">{t.size}, a one-month supply</span>
              </button>
            ))}
          </div>
          {noticeFor("type")}
        </Step>

        {sel.productType ? (
          <Step id="step-skin" number={2} title="What is your skin like?">
            <div className="tiles" role="radiogroup" aria-label="Skin type">
              {SKIN_TYPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={sel.skinType === s.id}
                  className={`tile${sel.skinType === s.id ? " is-selected" : ""}`}
                  onClick={() => chooseSkin(s.id)}
                >
                  <span className="tile__name">{s.name}</span>
                  <span className="tile__text">{s.description}</span>
                </button>
              ))}
            </div>
            {noticeFor("skin")}
          </Step>
        ) : null}

        {sel.productType && sel.skinType ? (
          <Step
            id="step-base"
            number={3}
            title="Choose a base"
            lead="The base sets the texture and decides which ingredients can be added."
          >
            <div className="options" role="radiogroup" aria-label="Base">
              {basesFor(sel.productType).map((b) => (
                <OptionRow
                  key={b.id}
                  role="radio"
                  name={b.name}
                  meta={b.keyIngredients}
                  text={b.summary}
                  verdict={baseVerdict(b)}
                  selected={sel.baseId === b.id}
                  fitLabel={fitLabel}
                  price={priceTag(b.sku, b.price, false)}
                  onToggle={() => chooseBase(b)}
                />
              ))}
            </div>
            {noticeFor("base")}
          </Step>
        ) : null}

        {base ? (
          <>
            <Step
              id="step-actives"
              number={4}
              title="Add actives"
              lead={`Choose up to ${MAX_ACTIVES}. Options are greyed out when they would not work with your skin, your base or each other.`}
              aside={`${sel.activeIds.length} of ${MAX_ACTIVES} chosen`}
            >
              {ACTIVE_GROUPS.map((group) => (
                <div key={group.id} className="group">
                  <h3 className="group__title">{group.name}</h3>
                  <p className="group__text">{group.description}</p>
                  <div className="options">
                    {ACTIVES.filter((a) => a.group === group.id).map((a) => (
                      <OptionRow
                        key={a.id}
                        role="checkbox"
                        name={a.name}
                        dose={a.dose}
                        meta={a.inci}
                        text={a.effect}
                        verdict={additionVerdict(a)}
                        selected={sel.activeIds.includes(a.id)}
                        fitLabel={fitLabel}
                        price={priceTag(a.sku, a.price, true)}
                        onToggle={() => toggle(a)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {noticeFor("actives")}
            </Step>

            <Step
              id="step-boosters"
              number={5}
              title="Finish with collagen or plant stem cells"
              lead="Add one, both or neither."
            >
              <div className="options">
                {BOOSTERS.map((a) => (
                  <OptionRow
                    key={a.id}
                    role="checkbox"
                    name={a.name}
                    dose={a.dose}
                    meta={a.inci}
                    text={a.effect}
                    verdict={additionVerdict(a)}
                    selected={sel.boosterIds.includes(a.id)}
                    fitLabel={fitLabel}
                    price={priceTag(a.sku, a.price, true)}
                    onToggle={() => toggle(a)}
                  />
                ))}
              </div>
              {noticeFor("boosters")}
              <p className="step__library">
                <Link href="/ingredients">Read how each ingredient works</Link>
              </p>
            </Step>

            {!reviewed ? (
              <div className="builder__next">
                <button type="button" className="btn btn--primary btn--wide" onClick={review}>
                  See my formula and price
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <aside className="sheet" aria-label="Formula sheet">
        <div className="sheet__head">
          <h2 className="sheet__title">{sel.productType ? productName(sel) : "Formula sheet"}</h2>
          <p className="sheet__code">{base ? formulaCode(sel) : "No formula yet"}</p>
        </div>
        <FormulaColumn
          layers={layers}
          volume={base ? `${base.sizeMl} ml` : undefined}
          emptyLabel="Your formula builds here as you choose."
        />
        <p className="sheet__scale-note">Diagram of what goes in the bottle. Not to scale.</p>
        <PhScale range={ph} pending={!base} />
        <dl className="sheet__facts">
          <div>
            <dt>Made for</dt>
            <dd>{skin ? `${skin.name} skin` : "Not chosen yet"}</dd>
          </div>
          <div>
            <dt>Use</dt>
            <dd>{!base ? "Not set yet" : formulaUsage(sel) === "pm" ? "At night only" : "Morning and night"}</dd>
          </div>
        </dl>
        {cautions.length ? (
          <div className="sheet__cautions">
            <h3>Before you use it</h3>
            <ul>
              {cautions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      {reviewed && complete && base ? (
        <section id="review" className="review" aria-labelledby="review-title">
          <h2 id="review-title" className="review__title">
            Price and delivery
          </h2>
          <table className="review__lines">
            <tbody>
              {price.lines.map((line) => (
                <tr key={line.id}>
                  <th scope="row">{line.name}</th>
                  <td>{formatMoney(line.cents, price.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">
                  {base.sizeMl} ml, a one-month supply
                </th>
                <td>{formatMoney(price.subtotalCents, price.currency)}</td>
              </tr>
            </tfoot>
          </table>

          <fieldset className="plans">
            <legend>How would you like it?</legend>
            {plans.map((plan) => {
              const q = quote(sel, plan.id, pricing);
              const checked = activePlanId === plan.id;
              return (
                <label key={plan.id} className={`plan${checked ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={checked}
                    onChange={() => {
                      setPlanId(plan.id);
                      setCheckout({ status: "idle" });
                    }}
                  />
                  <span className="plan__body">
                    <span className="plan__name">{plan.name}</span>
                    <span className="plan__text">{plan.detail}</span>
                  </span>
                  <span className="plan__price">
                    <span className="plan__amount">
                      {formatMoney(q.perDeliveryCents, q.currency)}
                      {plan.deliveries > 1 ? <span className="plan__per"> a month</span> : null}
                    </span>
                    {q.discountPct > 0 ? <span className="plan__save">Save {q.discountPct}%</span> : null}
                  </span>
                </label>
              );
            })}
          </fieldset>
          {plans.length > 1 ? <p className="review__note">{PLAN_BILLING_NOTE}</p> : null}

          {mode === "store-error" ? (
            <p className="alert" role="alert">
              We can&apos;t confirm prices with the store right now, so checkout is paused. Reload the
              page in a few minutes.
            </p>
          ) : null}

          <button
            type="button"
            className="btn btn--primary btn--wide"
            onClick={startCheckout}
            disabled={checkout.status === "working" || mode === "store-error"}
          >
            {checkout.status === "working" ? "Starting checkout" : "Continue to checkout"}
          </button>

          {checkout.status === "demo" ? (
            <p className="alert alert--info" role="status">
              Checkout is not connected yet. Once the store is linked, this button opens the Made from
              Earth checkout with this formula in the cart.
            </p>
          ) : null}
          {checkout.status === "error" ? (
            <p className="alert" role="alert">
              {checkout.message}
            </p>
          ) : null}

          <p className="review__note">{PATCH_TEST_NOTE}</p>
        </section>
      ) : null}

      {base ? (
        <div className="bar">
          <div className="bar__strip" aria-hidden="true">
            {layers.map((l) => (
              <span key={l.id} className={`bar__seg bar__seg--${l.kind}`} style={{ background: l.color }} />
            ))}
          </div>
          <div className="bar__row">
            <p className="bar__text">
              <span className="bar__name">{base.name}</span>
              <span className="bar__count">
                {additions.length === 0
                  ? "No additions yet"
                  : `${additions.length} addition${additions.length === 1 ? "" : "s"}`}
                {reviewed ? `, ${formatMoney(price.perDeliveryCents, price.currency)}` : ""}
              </span>
            </p>
            {reviewed ? (
              <a className="btn btn--primary" href="#review">
                Price and delivery
              </a>
            ) : (
              <button type="button" className="btn btn--primary" onClick={review}>
                See price
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ pieces ------------------------------ */

function Step(props: {
  id: string;
  number: number;
  title: string;
  lead?: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <section id={props.id} className="step" aria-labelledby={`${props.id}-title`}>
      <header className="step__head">
        <span className="step__number" aria-hidden="true">
          {props.number}
        </span>
        <div className="step__heading">
          <h2 id={`${props.id}-title`} className="step__title">
            {props.title}
          </h2>
          {props.lead ? <p className="step__lead">{props.lead}</p> : null}
        </div>
        {props.aside ? <p className="step__aside">{props.aside}</p> : null}
      </header>
      {props.children}
    </section>
  );
}

function OptionRow(props: {
  role: "radio" | "checkbox";
  name: string;
  dose?: string;
  meta: string;
  text: string;
  verdict: Verdict;
  selected: boolean;
  fitLabel?: string;
  price?: string;
  onToggle: () => void;
}) {
  // A chosen option can always be removed, even if it has since become unavailable.
  const disabled = props.verdict.status === "blocked" && !props.selected;
  const classes = ["option", `option--${props.role}`];
  if (props.selected) classes.push("is-selected");
  if (disabled) classes.push("is-blocked");

  return (
    <button
      type="button"
      role={props.role}
      aria-checked={props.selected}
      aria-disabled={disabled}
      className={classes.join(" ")}
      onClick={() => {
        if (!disabled) props.onToggle();
      }}
    >
      <span className="option__mark" aria-hidden="true" />
      <span className="option__body">
        <span className="option__top">
          <span className="option__name">{props.name}</span>
          {props.dose ? <span className="option__dose">{props.dose}</span> : null}
          {props.price ? <span className="option__price">{props.price}</span> : null}
        </span>
        <span className="option__meta">{props.meta}</span>
        {disabled ? (
          <span className="option__reason">
            <span className="option__reason-label">Not available. </span>
            {props.verdict.reason}
          </span>
        ) : (
          <span className="option__text">{props.text}</span>
        )}
        {!disabled && props.verdict.status === "recommended" && props.fitLabel ? (
          <span className="option__fit">{props.fitLabel}</span>
        ) : null}
      </span>
    </button>
  );
}
