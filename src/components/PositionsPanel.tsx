import { useCallback, useEffect, useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useManager } from "@/hooks/useManager";
import {
  positionStatus,
  usePositions,
  usePositionValue,
  useSettlements,
  type Position,
  type PositionStatus,
} from "@/hooks/usePositions";
import { useTrade } from "@/hooks/useTrade";
import { DUSDC, fmtUsd } from "@/lib/constants";
import { cn } from "@/lib/cn";

const GRID = "grid grid-cols-[minmax(0,1.4fr)_0.9fr_0.7fr_0.7fr_0.8fr_0.8fr_84px] items-center gap-3";

/** Plain 6-dec dUSDC number for tight columns — the header carries the unit. */
const fmtAmt = (raw: number | bigint) => (Number(raw) / 10 ** DUSDC.DECIMALS).toFixed(2);

function expiryLabel(expiry: number): string {
  const d = new Date(expiry);
  const hm = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay ? hm : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${hm}`;
}

const STATUS_STYLE: Record<PositionStatus, string> = {
  active: "bg-accent/15 text-accent",
  settling: "bg-surface-2 text-ink-subtle",
  won: "bg-success/15 text-success",
  lost: "bg-danger/15 text-danger",
};
const STATUS_TEXT: Record<PositionStatus, string> = {
  active: "Open",
  settling: "Settling…",
  won: "Won",
  lost: "Lost",
};

interface RowProps {
  position: Position;
  status: PositionStatus;
  onRedeem: () => void;
  onValue: (key: string, est: number | undefined) => void;
  isRedeeming: boolean;
  isNew: boolean;
}

function PositionRow({ position: p, status, onRedeem, onValue, isRedeeming, isNew }: RowProps) {
  const value = usePositionValue(p, status === "active");
  // Settled value is on-chain fact (1 dUSDC per unit if right); active value is a live bid quote.
  const est = status === "won" ? BigInt(p.quantity) : status === "lost" ? 0n : value.data;
  const pnl = est === undefined ? undefined : Number(est) - p.cost;

  useEffect(() => {
    onValue(p.key, est === undefined ? undefined : Number(est));
  }, [p.key, est, onValue]);

  return (
    <div className={cn(GRID, "rounded-md px-3 py-2 text-sm tabular-nums hover:bg-surface-2", isNew && "row-flash")}>
      <span className="flex items-center gap-1.5 truncate text-ink">
        {p.direction === "up" ? (
          <TrendingUp aria-hidden className="size-4 shrink-0 text-success" />
        ) : (
          <TrendingDown aria-hidden className="size-4 shrink-0 text-danger" />
        )}
        {p.direction === "up" ? "Up" : "Down"} {fmtUsd(p.strike)}
      </span>
      <span className="text-ink-muted">{expiryLabel(p.expiry)}</span>
      <span className="text-right text-ink-muted">{fmtAmt(p.quantity)}</span>
      <span className="text-right text-ink-muted">{fmtAmt(p.cost)}</span>
      <span className="text-right text-ink-muted">
        {est !== undefined ? fmtAmt(est) : status === "settling" ? "—" : "…"}
      </span>
      <span className={cn("text-right", pnl === undefined ? "text-ink-subtle" : pnl >= 0 ? "text-success" : "text-danger")}>
        {pnl === undefined ? "—" : `${pnl >= 0 ? "+" : "−"}${fmtAmt(Math.abs(pnl))}`}
      </span>
      <span className="flex justify-end">
        {status === "won" || status === "lost" ? (
          <Button isPending={isRedeeming} size="sm" variant="secondary" onPress={onRedeem}>
            Redeem
          </Button>
        ) : (
          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>{STATUS_TEXT[status]}</span>
        )}
      </span>
    </div>
  );
}

/** Bottom blotter — summary header + tabular rows, live est. value and one-click redeem. */
export function PositionsPanel() {
  const { managerId } = useManager();
  const { data: positions, isPending } = usePositions(managerId);
  const { redeem } = useTrade();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Rows report their est. value up so the summary can total it (cost is always known).
  const [values, setValues] = useState<Record<string, number | undefined>>({});
  const reportValue = useCallback(
    (key: string, est: number | undefined) => setValues((v) => (v[key] === est ? v : { ...v, [key]: est })),
    [],
  );
  const initialKeys = useRef<Set<string> | null>(null);
  if (positions && initialKeys.current === null) initialKeys.current = new Set(positions.map((p) => p.key));

  const expired = [...new Set((positions ?? []).filter((p) => p.expiry <= now).map((p) => p.oracleId))];
  const { data: settlements } = useSettlements(expired);

  const redeemingKey =
    redeem.isPending && redeem.variables
      ? `${redeem.variables.oracleId}|${redeem.variables.expiry}|${redeem.variables.strike}|${redeem.variables.direction}`
      : null;

  const openCost = (positions ?? []).reduce((a, p) => a + p.cost, 0);
  const estValue = (positions ?? []).reduce((a, p) => a + (values[p.key] ?? 0), 0);
  const netPnl = estValue - openCost;
  const hasValues = (positions ?? []).some((p) => values[p.key] !== undefined);

  return (
    <section className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">Positions</span>
        {positions && positions.length > 0 && (
          <div className="flex items-center gap-4 text-xs tabular-nums">
            <span className="text-ink-subtle">
              Cost <span className="text-ink-muted">{fmtAmt(openCost)}</span>
            </span>
            <span className="text-ink-subtle">
              Value <span className="text-ink-muted">{hasValues ? fmtAmt(estValue) : "…"}</span>
            </span>
            <span className="text-ink-subtle">
              Net PnL{" "}
              <span className={hasValues ? (netPnl >= 0 ? "text-success" : "text-danger") : "text-ink-muted"}>
                {hasValues ? `${netPnl >= 0 ? "+" : "−"}${fmtAmt(Math.abs(netPnl))}` : "…"}
              </span>
            </span>
          </div>
        )}
      </div>
      {!managerId || isPending ? (
        <div className="flex flex-col gap-1">
          {[0, 1].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      ) : positions && positions.length > 0 ? (
        <div className="lift flex min-h-0 flex-1 flex-col rounded-xl border border-hairline bg-surface-1 p-1.5">
          <div className={cn(GRID, "shrink-0 px-3 pb-1 pt-1.5 text-[11px] text-ink-tertiary")}>
            <span>Market</span>
            <span>Expiry</span>
            <span className="text-right">Size</span>
            <span className="text-right">Cost</span>
            <span className="text-right">Value</span>
            <span className="text-right">Est. PnL</span>
            <span />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {positions.map((p) => (
              <PositionRow
                key={p.key}
                isNew={!initialKeys.current?.has(p.key)}
                isRedeeming={redeemingKey === p.key}
                position={p}
                status={positionStatus(p, now, settlements?.[p.oracleId])}
                onRedeem={() =>
                  redeem.mutate({
                    managerId,
                    oracleId: p.oracleId,
                    expiry: p.expiry,
                    strike: p.strike,
                    direction: p.direction,
                    amountRaw: BigInt(p.quantity),
                  })
                }
                onValue={reportValue}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center rounded-xl border border-dashed border-hairline px-4 text-sm text-ink-subtle">
          No positions yet — your first tide awaits.
        </div>
      )}
      {redeem.error && <span className="px-1 text-xs text-danger">{redeem.error.message}</span>}
    </section>
  );
}
