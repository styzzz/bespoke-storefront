/**
 * The formula drawn as a graduated cylinder: the base at the bottom and one
 * band per addition above it. A diagram of what is in the bottle, not a
 * to-scale measurement.
 *
 * No hooks, so it renders on the server (home page) and in the builder.
 */

import type { CSSProperties } from "react";

export interface ColumnLayer {
  id: string;
  name: string;
  /** e.g. "5%". Omitted for the base. */
  dose?: string;
  color: string;
  kind: "base" | "active" | "booster";
}

interface Props {
  /** Bottom to top: base first, then additions in the order they were added. */
  layers: ColumnLayer[];
  /** Shown at the top of the scale, e.g. "30 ml". */
  volume?: string;
  /** Plays the fill animation once on load. Used on the home page only. */
  animate?: boolean;
  /** Text shown when nothing has been chosen yet. */
  emptyLabel?: string;
}

export function FormulaColumn({ layers, volume, animate = false, emptyLabel }: Props) {
  // Drawn top to bottom, so reverse the stacking order.
  const drawn = [...layers].reverse();
  const empty = layers.length === 0;

  return (
    <div className={`column${animate ? " column--animate" : ""}`}>
      <div className="column__scale" aria-hidden="true">
        {volume ? <span className="column__volume">{volume}</span> : null}
      </div>
      <ol
        className={`column__glass${empty ? " column__glass--empty" : ""}`}
        aria-label="Formula contents, top to bottom"
      >
        <li className="column__headspace" aria-hidden="true" />
        {empty ? (
          <li className="column__placeholder">{emptyLabel ?? "Your formula appears here."}</li>
        ) : (
          drawn.map((layer, i) => (
            <li
              key={layer.id}
              className={`column__layer column__layer--${layer.kind}`}
              style={{ "--layer": layer.color, "--order": String(drawn.length - 1 - i) } as CSSProperties}
            >
              <span className="column__fill" aria-hidden="true" />
              <span className="column__label">
                <span className="column__name">{layer.name}</span>
                {layer.dose ? <span className="column__dose">{layer.dose}</span> : null}
              </span>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
