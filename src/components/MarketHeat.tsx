import { motion } from "motion/react";
import { useMarketPositions } from "@/hooks/useMarketPositions";
import { DUSDC, fmtUsd } from "@/lib/constants";

const W = 560;
const PAD = { top: 6, right: 10, bottom: 16, left: 56 };

interface MarketHeatProps {
  oracleId: string | undefined;
}

/** Net minted positioning per strike — every trader's mints on this oracle. */
export function MarketHeat({ oracleId }: MarketHeatProps) {
  const { data, isPending } = useMarketPositions(oracleId);
  const buckets = data?.buckets ?? [];
  const rows = buckets.length;

  // Adaptive density: a handful of strikes get roomy rows, a wall of them a thin strip.
  const rowH = rows <= 8 ? 18 : rows <= 16 ? 12 : 8;
  const labelEvery = rowH >= 12 ? 1 : Math.ceil(rows / 8);
  const H = PAD.top + rows * rowH + PAD.bottom;
  const cx = PAD.left + (W - PAD.left - PAD.right) / 2;
  const halfW = (W - PAD.left - PAD.right) / 2 - 2;
  const maxAbs = Math.max(...buckets.map((b) => Math.abs(b.up - b.down)), 1);

  const total = (data ? data.totalQty / 10 ** DUSDC.DECIMALS : 0).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          Where the market is positioned
        </span>
        {rows > 0 && (
          <span className="text-xs tabular-nums text-ink-subtle">
            {total} contracts · {rows} strikes
          </span>
        )}
      </div>
      {isPending ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-2" />
      ) : rows === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline px-4 py-6 text-sm text-ink-subtle">
          No mints on this expiry yet — be the first to take a side.
        </div>
      ) : (
        <svg
          aria-label="Net minted position by strike"
          className="w-full"
          role="img"
          viewBox={`0 0 ${W} ${H}`}
        >
          <line className="stroke-hairline" x1={cx} x2={cx} y1={PAD.top} y2={H - PAD.bottom} />
          {buckets.map((b, i) => {
            const net = b.up - b.down;
            const w = Math.max((Math.abs(net) / maxAbs) * halfW, net === 0 ? 0 : 2);
            const rowY = PAD.top + i * rowH;
            return (
              <g key={b.strike}>
                {(i % labelEvery === 0 || i === rows - 1) && (
                  <text
                    className="fill-ink-tertiary text-[10px] tabular-nums"
                    textAnchor="end"
                    x={PAD.left - 6}
                    y={rowY + rowH / 2 + 3}
                  >
                    {fmtUsd(b.strike)}
                  </text>
                )}
                <motion.rect
                  animate={{ width: w, x: net >= 0 ? cx : cx - w }}
                  className={net >= 0 ? "fill-success/85" : "fill-danger/85"}
                  height={rowH * 0.56}
                  initial={false}
                  rx={1.5}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  y={rowY + rowH * 0.22}
                />
              </g>
            );
          })}
          <text className="fill-danger/90 text-[9px]" x={PAD.left} y={H - 4}>
            ← net down
          </text>
          <text className="fill-success/90 text-[9px]" textAnchor="end" x={W - PAD.right} y={H - 4}>
            net up →
          </text>
        </svg>
      )}
    </div>
  );
}
