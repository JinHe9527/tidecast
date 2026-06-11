import { fmtUsd } from "@/lib/constants";
import { cn } from "@/lib/cn";

const SPAN = 4; // ticks above/below ATM → up to 9 rows

interface StrikeLadderProps {
  atm: number | undefined; // spot floored to tick, 9-dec fixed point
  tickSize: number | undefined;
  minStrike: number;
  selected: number | undefined;
  onSelect: (strike: number) => void;
}

/** Vertical strike ladder centered on the tick-snapped spot; high strikes on top. */
export function StrikeLadder({ atm, tickSize, minStrike, selected, onSelect }: StrikeLadderProps) {
  const strikes: number[] = [];
  if (atm !== undefined && tickSize !== undefined) {
    for (let i = SPAN; i >= -SPAN; i--) {
      const s = atm + i * tickSize;
      if (s >= minStrike) strikes.push(s);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">Strike</span>
      {strikes.length === 0 ? (
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      ) : (
        <div aria-label="Strike" className="flex flex-col gap-0.5" role="listbox">
          {strikes.map((s) => (
            <button
              key={s}
              aria-selected={s === selected}
              className={cn(
                "flex h-9 items-center justify-between rounded-md px-3 text-sm tabular-nums",
                "text-ink-muted outline-none transition-colors hover:bg-surface-2",
                "aria-selected:bg-accent/15 aria-selected:text-accent",
                "focus-visible:ring-2 focus-visible:ring-accent-focus",
              )}
              role="option"
              type="button"
              onClick={() => onSelect(s)}
            >
              <span>{fmtUsd(s)}</span>
              {s === atm && (
                <span className="rounded border border-hairline-strong px-1 py-px text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
                  ATM
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
