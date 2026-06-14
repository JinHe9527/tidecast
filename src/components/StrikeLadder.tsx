import { useEffect, useRef } from "react";
import { upProbability, type SviParams } from "@/hooks/useSvi";
import type { MarketPositions } from "@/hooks/useMarketPositions";
import type { Direction } from "@/hooks/useQuote";
import { fmtUsd } from "@/lib/constants";
import { cn } from "@/lib/cn";

interface SideCellProps {
  side: Direction;
  prob: number; // 0..1, NaN when no fit
  heat: number; // 0..1 depth fraction of the busiest strike
  selected: boolean;
  align: "left" | "right";
  onSelect: () => void;
}

/** One side of a ladder row — est. probability over a faint depth-heat bar. */
function SideCell({ side, prob, heat, selected, align, onSelect }: SideCellProps) {
  const tint = side === "up" ? "var(--success)" : "var(--danger)";
  return (
    <button
      className={cn(
        "relative flex h-8 items-center overflow-hidden rounded-md px-2.5 text-xs tabular-nums outline-none transition-colors",
        align === "right" ? "justify-end" : "justify-start",
        "hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-focus",
        selected ? (side === "up" ? "text-success" : "text-danger") : "text-ink-subtle",
      )}
      type="button"
      onClick={onSelect}
    >
      {heat > 0 && (
        <span
          aria-hidden
          className="absolute inset-y-1.5 rounded-sm"
          style={{
            [align === "right" ? "right" : "left"]: 0,
            width: `${Math.max(heat * 100, 4)}%`,
            background: `color-mix(in srgb, ${tint} 26%, transparent)`,
          }}
        />
      )}
      <span className="relative">{Number.isFinite(prob) ? `${Math.round(prob * 100)}%` : "—"}</span>
    </button>
  );
}

interface StrikeLadderProps {
  strikes: number[]; // shared domain, high→low
  atm: number | undefined;
  selected: number | undefined;
  direction: Direction;
  hoveredStrike: number | null;
  svi: SviParams | undefined;
  forward: number | undefined;
  yearsToExpiry: number;
  market: MarketPositions | undefined;
  onHover: (strike: number | null) => void;
  onSelect: (strike: number, direction: Direction) => void;
}

/** Two-sided strike ladder — Down | Strike | Up, the order cockpit's instrument. */
export function StrikeLadder({
  strikes,
  atm,
  selected,
  direction,
  hoveredStrike,
  svi,
  forward,
  yearsToExpiry,
  market,
  onHover,
  onSelect,
}: StrikeLadderProps) {
  // Keep the ATM row centered in the scroll viewport when the domain shifts.
  const atmRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    atmRef.current?.scrollIntoView({ block: "center" });
  }, [atm]);

  const maxNet = Math.max(...(market?.buckets ?? []).map((b) => Math.abs(b.up - b.down)), 1);
  const heatAt = (strike: number, side: Direction) => {
    const b = market?.buckets.find((x) => x.strike === strike);
    if (!b) return 0;
    const v = side === "up" ? b.up : b.down;
    return v > 0 ? v / maxNet : 0;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-3 px-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
        <span>Down</span>
        <span className="text-center">Strike</span>
        <span className="text-right">Up</span>
      </div>
      {strikes.length === 0 ? (
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      ) : (
        <div aria-label="Strike ladder" className="flex flex-col gap-0.5" role="listbox">
          {strikes.map((s) => {
            const up = forward !== undefined && svi ? upProbability(svi, s, forward, yearsToExpiry) : NaN;
            const isAtm = s === atm;
            const isHover = s === hoveredStrike;
            const rowSel = s === selected;
            return (
              <div
                key={s}
                ref={isAtm ? atmRef : undefined}
                className={cn(
                  "grid grid-cols-3 items-center rounded-md transition-colors",
                  isAtm && "bg-surface-1",
                  isHover && !rowSel && "bg-surface-2/70",
                  rowSel && "bg-accent/15 ring-1 ring-accent/40",
                )}
                onMouseEnter={() => onHover(s)}
                onMouseLeave={() => onHover(null)}
              >
                <SideCell
                  align="left"
                  heat={heatAt(s, "down")}
                  prob={Number.isFinite(up) ? 1 - up : NaN}
                  selected={rowSel && direction === "down"}
                  side="down"
                  onSelect={() => onSelect(s, "down")}
                />
                <span
                  className={cn(
                    "flex items-center justify-center gap-1 font-mono text-xs tabular-nums",
                    rowSel ? "font-semibold text-accent" : "text-ink-muted",
                  )}
                >
                  {fmtUsd(s)}
                  {isAtm && (
                    <span className="rounded border border-hairline-strong px-1 text-[9px] font-medium uppercase tracking-wide text-ink-tertiary">
                      ATM
                    </span>
                  )}
                </span>
                <SideCell
                  align="right"
                  heat={heatAt(s, "up")}
                  prob={up}
                  selected={rowSel && direction === "up"}
                  side="up"
                  onSelect={() => onSelect(s, "up")}
                />
              </div>
            );
          })}
        </div>
      )}
      <span className="px-2.5 text-[10px] text-ink-tertiary">
        est. win probability · click a side to load the ticket
      </span>
    </div>
  );
}
