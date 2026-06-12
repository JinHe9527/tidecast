import { motion } from "motion/react";
import { expiryLabel } from "@/components/ExpiryPicker";
import { impliedVol, useSvi } from "@/hooks/useSvi";
import { fmtUsd } from "@/lib/constants";

const W = 560;
const H = 176;
const PAD = { top: 10, right: 10, bottom: 20, left: 44 };
const N = 61; // fixed sample count keeps the path structure stable, so `d` tweens cleanly
const RANGE = 0.03; // strike domain: forward ±3%
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface Chart {
  d: string;
  forwardX: number;
  dot: { x: number; y: number } | null;
  yTicks: { pos: number; label: string }[];
  xTicks: { pos: number; label: string; anchor: "start" | "middle" | "end" }[];
}

interface VolSmileProps {
  oracleId: string | undefined;
  expiry: number | undefined;
  forward: number | undefined; // 9-dec fixed point
  strike: number | undefined; // 9-dec fixed point
}

/** Live SVI implied-vol smile for the selected expiry. */
export function VolSmile({ oracleId, expiry, forward, strike }: VolSmileProps) {
  const { data: svi, isPending } = useSvi(oracleId);
  const T = expiry !== undefined ? (expiry - Date.now()) / YEAR_MS : 0;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  let chart: Chart | null = null;
  let atLabel: string | null = null;
  if (svi && forward !== undefined && T > 0) {
    const ivs = Array.from({ length: N }, (_, i) =>
      impliedVol(svi, forward * (1 - RANGE + (2 * RANGE * i) / (N - 1)), forward, T),
    );
    // Degenerate fit (negative variance / NaN) → honest empty state, not garbage.
    if (ivs.every((v) => Number.isFinite(v) && v > 0)) {
      const lo = Math.min(...ivs);
      const hi = Math.max(...ivs);
      const span = Math.max(hi - lo, 0.004); // keep a near-flat smile readable
      const yLo = (lo + hi) / 2 - span * 0.65;
      const yHi = (lo + hi) / 2 + span * 0.65;
      const x = (i: number) => PAD.left + (i / (N - 1)) * innerW;
      const y = (iv: number) => PAD.top + (1 - (iv - yLo) / (yHi - yLo)) * innerH;

      const atIv = strike !== undefined ? impliedVol(svi, strike, forward, T) : NaN;
      const ratio = strike !== undefined ? strike / forward : NaN;
      if (strike !== undefined && Number.isFinite(atIv)) {
        atLabel = `${(atIv * 100).toFixed(1)}% IV at ${fmtUsd(strike)}`;
      }
      const hasDot = Number.isFinite(atIv) && Math.abs(ratio - 1) <= RANGE;
      chart = {
        d: ivs.map((iv, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(iv).toFixed(1)}`).join(""),
        forwardX: PAD.left + innerW / 2,
        dot: hasDot
          ? { x: PAD.left + ((ratio - (1 - RANGE)) / (2 * RANGE)) * innerW, y: y(atIv) }
          : null,
        yTicks: [0.12, 0.5, 0.88].map((f) => ({
          pos: PAD.top + (1 - f) * innerH,
          label: `${((yLo + f * (yHi - yLo)) * 100).toFixed(0)}%`,
        })),
        xTicks: [
          { pos: PAD.left, label: fmtUsd(forward * (1 - RANGE)), anchor: "start" as const },
          { pos: PAD.left + innerW / 2, label: fmtUsd(forward), anchor: "middle" as const },
          { pos: W - PAD.right, label: fmtUsd(forward * (1 + RANGE)), anchor: "end" as const },
        ],
      };
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          Volatility smile{expiry !== undefined && ` · ${expiryLabel(expiry, Date.now())}`}
        </span>
        {atLabel && <span className="text-xs tabular-nums text-accent">{atLabel}</span>}
      </div>
      {chart ? (
        <svg aria-label="Implied volatility by strike" className="w-full" role="img" viewBox={`0 0 ${W} ${H}`}>
          {chart.yTicks.map((t) => (
            <g key={t.pos}>
              <line className="stroke-hairline" x1={PAD.left} x2={W - PAD.right} y1={t.pos} y2={t.pos} />
              <text
                className="fill-ink-tertiary text-[10px] tabular-nums"
                textAnchor="end"
                x={PAD.left - 6}
                y={t.pos + 3}
              >
                {t.label}
              </text>
            </g>
          ))}
          <line
            className="stroke-hairline-strong"
            strokeDasharray="3 3"
            x1={chart.forwardX}
            x2={chart.forwardX}
            y1={PAD.top}
            y2={H - PAD.bottom}
          />
          {chart.xTicks.map((t) => (
            <text
              key={t.pos}
              className="fill-ink-tertiary text-[10px] tabular-nums"
              textAnchor={t.anchor}
              x={t.pos}
              y={H - 5}
            >
              {t.label}
            </text>
          ))}
          <motion.path
            animate={{ d: chart.d }}
            className="stroke-accent"
            fill="none"
            initial={false}
            strokeLinecap="round"
            strokeWidth={1.75}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {chart.dot && (
            <motion.circle
              animate={{ cx: chart.dot.x, cy: chart.dot.y }}
              className="fill-accent"
              initial={false}
              r={3.5}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          )}
        </svg>
      ) : isPending ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
      ) : (
        <div className="flex h-40 items-center rounded-xl border border-dashed border-hairline px-4 text-sm text-ink-subtle">
          No usable SVI fit for this expiry yet — the smile appears with the next oracle print.
        </div>
      )}
    </div>
  );
}
