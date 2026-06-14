import { motion } from "motion/react";
import type { MarketPositions } from "@/hooks/useMarketPositions";
import { DUSDC, fmtUsd } from "@/lib/constants";
import { cn } from "@/lib/cn";

// Same geometry as VolSmile so bars sit directly under the curve, strike-for-strike.
const W = 720;
const H = 86;
const PAD = { top: 6, right: 16, bottom: 16, left: 46 };

interface MarketHeatProps {
  data: MarketPositions | undefined;
  isPending: boolean;
  strikeLo: number | undefined;
  strikeHi: number | undefined;
  hoveredStrike: number | null;
  onHover: (strike: number | null) => void;
}

/** Net minted positioning per strike — diverging bars under the smile's strike axis. */
export function MarketHeat({ data, isPending, strikeLo, strikeHi, hoveredStrike, onHover }: MarketHeatProps) {
  const buckets = data?.buckets ?? [];
  const ready = strikeLo !== undefined && strikeHi !== undefined && strikeHi > strikeLo;
  const innerW = W - PAD.left - PAD.right;
  const zeroY = PAD.top + (H - PAD.top - PAD.bottom) / 2;
  const maxAbs = Math.max(...buckets.map((b) => Math.abs(b.up - b.down)), 1);
  const x = (s: number) => PAD.left + ((s - strikeLo!) / (strikeHi! - strikeLo!)) * innerW;

  // Readout: net leaning side + the strike carrying the most one-sided flow.
  const netUp = buckets.reduce((a, b) => a + (b.up - b.down), 0);
  const busiest = buckets.reduce<{ strike: number; net: number } | null>((acc, b) => {
    const net = b.up - b.down;
    return acc && Math.abs(acc.net) >= Math.abs(net) ? acc : { strike: b.strike, net };
  }, null);
  const total = (data ? data.totalQty / 10 ** DUSDC.DECIMALS : 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">Market positioning</span>
        {buckets.length > 0 && busiest && (
          <span className="text-[11px] tabular-nums text-ink-tertiary">
            {total} contracts · net {netUp >= 0 ? "up" : "down"} · heaviest at {fmtUsd(busiest.strike)}
          </span>
        )}
      </div>
      {isPending ? (
        <div className="h-[86px] animate-pulse rounded-lg bg-surface-2" />
      ) : !ready || buckets.length === 0 ? (
        <div className="flex h-[86px] items-center rounded-lg border border-dashed border-hairline px-4 text-xs text-ink-subtle">
          No mints on this expiry yet — be the first to take a side.
        </div>
      ) : (
        <svg aria-label="Net minted position by strike" className="w-full" preserveAspectRatio="none" role="img" viewBox={`0 0 ${W} ${H}`}>
          <line className="stroke-hairline" x1={PAD.left} x2={W - PAD.right} y1={zeroY} y2={zeroY} />
          {buckets
            .filter((b) => b.strike >= strikeLo! && b.strike <= strikeHi!)
            .map((b) => {
              const net = b.up - b.down;
              if (net === 0) return null;
              const h = (Math.abs(net) / maxAbs) * (zeroY - PAD.top);
              const cx = x(b.strike);
              const hov = b.strike === hoveredStrike;
              return (
                <g key={b.strike} onMouseEnter={() => onHover(b.strike)} onMouseLeave={() => onHover(null)}>
                  <rect fill="transparent" height={H} width={Math.max(innerW / buckets.length, 8)} x={cx - innerW / buckets.length / 2} y={0} />
                  <motion.rect
                    animate={{ height: h, y: net >= 0 ? zeroY - h : zeroY }}
                    className={cn(net >= 0 ? "fill-success" : "fill-danger", hov ? "opacity-100" : "opacity-70")}
                    initial={false}
                    rx={1.5}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    width={6}
                    x={cx - 3}
                  />
                </g>
              );
            })}
          <text className="fill-success/70 text-[9px]" x={PAD.left} y={PAD.top + 8}>
            net up ↑
          </text>
          <text className="fill-danger/70 text-[9px]" x={PAD.left} y={H - 4}>
            net down ↓
          </text>
        </svg>
      )}
    </div>
  );
}
