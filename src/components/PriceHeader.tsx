import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { OraclePrice } from "@/hooks/usePrice";
import { useSpotHistory } from "@/hooks/usePrice";
import { fmtUsd } from "@/lib/constants";
import { cn } from "@/lib/cn";

const SPARK_W = 64;
const SPARK_H = 16;

/** Inline recent-spot sparkline — last ~40 prints, autoscaled to its band. */
function Sparkline({ series, up }: { series: number[]; up: boolean | null }) {
  if (series.length < 2) return <span className="inline-block" style={{ width: SPARK_W }} />;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = Math.max(hi - lo, 1);
  const d = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * SPARK_W;
      const y = SPARK_H - 1 - ((v - lo) / span) * (SPARK_H - 2);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("");
  const stroke = up === null ? "stroke-ink-tertiary" : up ? "stroke-success" : "stroke-danger";
  return (
    <svg aria-hidden className="shrink-0" height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} width={SPARK_W}>
      <path className={cn("opacity-70", stroke)} d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} />
    </svg>
  );
}

/** Live BTC ticker for the header bar: spot · signed Δ% vs forward · sparkline · print age. */
export function HeaderTicker({ price, oracleId }: { price: OraclePrice | undefined; oracleId: string | undefined }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);
  const age = price ? Math.max(0, Math.floor((now - price.timestamp) / 1_000)) : null;
  const series = useSpotHistory(oracleId, price?.spot);

  // Δ% of spot vs the oracle forward — the market's implied drift, signed.
  const delta = price && price.forward > 0 ? ((price.spot - price.forward) / price.forward) * 100 : null;
  const up = delta === null ? null : delta >= 0;

  // Desaturated tick flash — a brief tinted background, not a loud color swap.
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevSpot = useRef<number | null>(null);
  useEffect(() => {
    if (!price) return;
    const prev = prevSpot.current;
    prevSpot.current = price.spot;
    if (prev === null || prev === price.spot) return;
    setFlash(price.spot > prev ? "up" : "down");
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [price]);

  if (!price) {
    return <span className="text-sm text-ink-tertiary">waiting for oracle prints…</span>;
  }

  return (
    <div className="flex items-center gap-3 tabular-nums">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">BTC</span>
      <motion.span
        key={price.spot}
        animate={{ opacity: 1 }}
        className={cn(
          "rounded-md px-1.5 text-lg font-semibold tracking-tight text-ink transition-colors duration-500",
          flash === "up" && "bg-[color-mix(in_srgb,var(--success)_20%,transparent)]",
          flash === "down" && "bg-[color-mix(in_srgb,var(--danger)_20%,transparent)]",
        )}
        initial={{ opacity: 0.5 }}
        transition={{ duration: 0.2 }}
      >
        {fmtUsd(price.spot, 2)}
      </motion.span>
      {delta !== null && (
        <span className={cn("text-xs font-medium", up ? "text-success" : "text-danger")}>
          {up ? "+" : "−"}
          {Math.abs(delta).toFixed(2)}%
        </span>
      )}
      <Sparkline series={series} up={up} />
      <motion.span
        key={price.timestamp}
        animate={{ opacity: [0.4, 1] }}
        className="text-[11px] text-ink-tertiary"
        transition={{ duration: 0.5 }}
      >
        {age}s ago
      </motion.span>
    </div>
  );
}
