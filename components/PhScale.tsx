import type { PhWindow } from "@/lib/catalog";
import { formatPh } from "@/lib/rules";

const SCALE_MIN = 3;
const SCALE_MAX = 8;
const TICKS = [3, 4, 5, 6, 7, 8];

interface Props {
  /** The pH range the formula must sit in. null = the formula has no water. */
  range: PhWindow | null;
  /** True when there is no base yet. */
  pending?: boolean;
}

/** A pH ruler with the formula's workable range marked on it. */
export function PhScale({ range, pending = false }: Props) {
  const pct = (ph: number) => ((ph - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
  const shown = range && !pending ? range : null;

  let caption: string;
  if (pending) caption = "Set once you choose a base.";
  else if (!range) caption = "This base contains no water, so it has no pH.";
  else caption = `This formula will be made at pH ${formatPh(range)}.`;

  return (
    <div className="ph">
      <div className="ph__head">
        <span className="ph__title">Formula pH</span>
        <span className="ph__value">{shown ? formatPh(shown) : "n/a"}</span>
      </div>
      <div className="ph__track" aria-hidden="true">
        {shown ? (
          <span
            className="ph__band"
            style={{ left: `${pct(shown.min)}%`, width: `${Math.max(pct(shown.max) - pct(shown.min), 1.5)}%` }}
          />
        ) : null}
        {TICKS.map((t) => (
          <span key={t} className="ph__tick" style={{ left: `${pct(t)}%` }}>
            <span className="ph__tick-label">{t}</span>
          </span>
        ))}
      </div>
      <p className="ph__caption">{caption}</p>
    </div>
  );
}
