import { useId } from "react";
import { motion } from "motion/react";
import { expiryLabel } from "@/components/ExpiryPicker";
import { impliedVol, useSvi } from "@/hooks/useSvi";
import { fmtUsd } from "@/lib/constants";

const W = 720;
const H = 248;
const PAD = { top: 14, right: 16, bottom: 22, left: 46 };
const N = 81; // fixed sample count keeps `d` tweening cleanly between fits
// Log-moneyness half-width of the plotted surface. A smile is only a smile over
// a wide strike span; the tradeable ladder (±4 ticks ≈ ±0.006%) is a sliver at
// ATM, so we draw the whole curve and mark that sliver on it.
const K_HALF = 0.25;

interface VolSmileProps {
  oracleId: string | undefined;
  expiry: number | undefined;
  forward: number | undefined; // 9-dec fixed point
  strikeLo: number | undefined; // tradeable ladder domain, low edge (9-dec)
  strikeHi: number | undefined; // tradeable ladder domain, high edge
  selectedStrike: number | undefined;
  hoveredStrike: number | null;
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** Live SVI implied-vol smile — the analytics hero. Plots the full surface over a
 *  wide moneyness range so the curve reads as a smile, with the tradeable band,
 *  ATM and the selected strike marked on it. */
export function VolSmile({ oracleId, expiry, forward, strikeLo, strikeHi, selectedStrike, hoveredStrike }: VolSmileProps) {
  const { data: svi, isPending } = useSvi(oracleId);
  const gradId = useId();
  const T = expiry !== undefined ? (expiry - Date.now()) / YEAR_MS : 0;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const ready = svi && forward !== undefined && forward > 0 && T > 0;

  let chart: {
    line: string;
    area: string;
    atmX: number;
    band: { x: number; w: number } | null;
    yTicks: { pos: number; label: string }[];
    xTicks: { pos: number; label: string; anchor: "start" | "middle" | "end" }[];
    dot: (s: number | null | undefined) => { x: number; y: number } | null;
    atLabel: string | null;
    skew: string | null;
  } | null = null;

  if (ready) {
    const fwd = forward!;
    // Wide surface domain centered on the forward (market's real strike span).
    const lo = fwd * Math.exp(-K_HALF);
    const hi = fwd * Math.exp(K_HALF);
    const strikeAt = (i: number) => lo + ((hi - lo) * i) / (N - 1);
    const ivs = Array.from({ length: N }, (_, i) => impliedVol(svi!, strikeAt(i), fwd, T));

    if (ivs.every((v) => Number.isFinite(v) && v > 0)) {
      const vLo = Math.min(...ivs);
      const vHi = Math.max(...ivs);
      const span = Math.max(vHi - vLo, 0.01);
      const yLo = vLo - span * 0.12;
      const yHi = vHi + span * 0.18;
      const x = (s: number) => PAD.left + ((s - lo) / (hi - lo)) * innerW;
      const y = (iv: number) => PAD.top + (1 - (iv - yLo) / (yHi - yLo)) * innerH;

      const pts = ivs.map((iv, i) => `${x(strikeAt(i)).toFixed(1)},${y(iv).toFixed(1)}`);
      const line = pts.map((p, i) => `${i ? "L" : "M"}${p}`).join("");
      const area = `M${PAD.left},${(H - PAD.bottom).toFixed(1)}L${pts.join("L")}L${(W - PAD.right).toFixed(1)},${(
        H - PAD.bottom
      ).toFixed(1)}Z`;

      const dot = (s: number | null | undefined) => {
        if (s == null || s < lo || s > hi) return null;
        const iv = impliedVol(svi!, s, fwd, T);
        return Number.isFinite(iv) ? { x: x(s), y: y(iv) } : null;
      };

      // Tradeable ladder window, marked on the surface (min 7px so the sliver shows).
      let band: { x: number; w: number } | null = null;
      if (strikeLo !== undefined && strikeHi !== undefined) {
        const bx0 = x(Math.max(strikeLo, lo));
        const bx1 = x(Math.min(strikeHi, hi));
        const w = Math.max(bx1 - bx0, 7);
        band = { x: (bx0 + bx1) / 2 - w / 2, w };
      }

      const atIv = selectedStrike != null ? impliedVol(svi!, selectedStrike, fwd, T) : NaN;
      const atLabel =
        selectedStrike != null && Number.isFinite(atIv)
          ? `${(atIv * 100).toFixed(1)}% IV at ${fmtUsd(selectedStrike)}`
          : null;

      // Skew sign: IV at the low wing vs the high wing tells you which tail is bid.
      const wingLo = ivs[0];
      const wingHi = ivs[N - 1];
      const skew =
        Math.abs(wingLo - wingHi) < 0.005 ? "flat" : wingLo > wingHi ? "put skew · downside bid" : "call skew · upside bid";

      chart = {
        line,
        area,
        atmX: x(fwd),
        band,
        yTicks: [0.12, 0.5, 0.88].map((f) => ({
          pos: PAD.top + (1 - f) * innerH,
          label: `${((yLo + f * (yHi - yLo)) * 100).toFixed(0)}%`,
        })),
        xTicks: [
          { pos: PAD.left, label: fmtUsd(lo), anchor: "start" as const },
          { pos: x(fwd), label: fmtUsd(fwd), anchor: "middle" as const },
          { pos: W - PAD.right, label: fmtUsd(hi), anchor: "end" as const },
        ],
        dot,
        atLabel,
        skew,
      };
    }
  }

  const selDot = chart?.dot(selectedStrike) ?? null;
  const hovDot = chart?.dot(hoveredStrike) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
          Volatility smile{expiry !== undefined && ` · ${expiryLabel(expiry, Date.now())}`}
        </span>
        <div className="flex items-baseline gap-3 tabular-nums">
          {chart?.skew && <span className="text-[11px] text-ink-tertiary">{chart.skew}</span>}
          {chart?.atLabel && <span className="text-xs text-accent">{chart.atLabel}</span>}
        </div>
      </div>
      {chart ? (
        <svg aria-label="Implied volatility by strike" className="min-h-0 w-full flex-1" preserveAspectRatio="none" role="img" viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {chart.yTicks.map((t) => (
            <g key={t.pos}>
              <line className="stroke-hairline" x1={PAD.left} x2={W - PAD.right} y1={t.pos} y2={t.pos} />
              <text className="fill-ink-tertiary text-[10px] tabular-nums" textAnchor="end" x={PAD.left - 6} y={t.pos + 3}>
                {t.label}
              </text>
            </g>
          ))}
          {chart.band && (
            <rect className="fill-accent" height={innerH} opacity={0.09} width={chart.band.w} x={chart.band.x} y={PAD.top} />
          )}
          <line className="stroke-hairline-strong" strokeDasharray="3 3" x1={chart.atmX} x2={chart.atmX} y1={PAD.top} y2={H - PAD.bottom} />
          <text className="fill-ink-tertiary text-[9px] uppercase tracking-wide" x={chart.atmX + 4} y={PAD.top + 9}>
            ATM
          </text>
          {chart.xTicks.map((t) => (
            <text key={t.pos} className="fill-ink-tertiary text-[10px] tabular-nums" textAnchor={t.anchor} x={t.pos} y={H - 6}>
              {t.label}
            </text>
          ))}
          <motion.path animate={{ d: chart.area }} fill={`url(#${gradId})`} initial={false} transition={{ duration: 0.6, ease: "easeOut" }} />
          <motion.path
            animate={{ d: chart.line }}
            className="stroke-accent"
            fill="none"
            initial={false}
            strokeLinecap="round"
            strokeWidth={2}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {hovDot && !selDot && (
            <circle className="fill-accent/45" cx={hovDot.x} cy={hovDot.y} r={3} />
          )}
          {hovDot && selDot && (hovDot.x !== selDot.x) && (
            <circle className="fill-accent/40 stroke-canvas" cx={hovDot.x} cy={hovDot.y} r={3} strokeWidth={1.25} />
          )}
          {selDot && (
            <motion.circle animate={{ cx: selDot.x, cy: selDot.y }} className="fill-accent stroke-canvas" initial={false} r={4} strokeWidth={1.5} transition={{ duration: 0.3, ease: "easeOut" }} />
          )}
        </svg>
      ) : isPending ? (
        <div className="min-h-0 flex-1 animate-pulse rounded-xl bg-surface-2" />
      ) : (
        <div className="flex min-h-0 flex-1 items-center rounded-xl border border-dashed border-hairline px-4 text-sm text-ink-subtle">
          No usable SVI fit for this expiry yet — the smile appears with the next oracle print.
        </div>
      )}
    </div>
  );
}
