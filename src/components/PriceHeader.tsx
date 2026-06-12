import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { OraclePrice } from "@/hooks/usePrice";
import { fmtUsd } from "@/lib/constants";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Big live BTC spot + forward and print age. */
export function PriceHeader({ price }: { price: OraclePrice | undefined }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);
  const age = price ? Math.max(0, Math.floor((now - price.timestamp) / 1_000)) : null;

  // Brief direction pulse on spot change — tick up flashes success, down danger,
  // then eases back to ink (transition-colors; reduced-motion makes it a snap).
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevSpot = useRef<number | null>(null);
  useEffect(() => {
    if (!price) return;
    const prev = prevSpot.current;
    prevSpot.current = price.spot;
    if (prev === null || prev === price.spot) return;
    setFlash(price.spot > prev ? "up" : "down");
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [price]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
        BTC · spot
      </span>
      <div className="text-4xl font-semibold tabular-nums tracking-tight">
        {price ? (
          <motion.span
            key={price.spot}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "inline-block transition-colors duration-500",
              flash === "up" ? "text-success" : flash === "down" ? "text-danger" : "text-ink",
            )}
            initial={{ opacity: 0.4, y: 3 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {fmtUsd(price.spot, 2)}
          </motion.span>
        ) : (
          <span className="text-ink-tertiary">—</span>
        )}
      </div>
      <span className="text-xs tabular-nums text-ink-subtle">
        {price ? (
          <>
            Forward {fmtUsd(price.forward, 2)} · updated {age}s ago
          </>
        ) : (
          "waiting for oracle prints…"
        )}
      </span>
    </div>
  );
}
