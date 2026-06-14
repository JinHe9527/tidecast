import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { NumberField } from "@heroui/react";
import { Check, ExternalLink, Loader2, TrendingDown, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDusdc } from "@/hooks/useDusdc";
import { useManager, useManagerBalance } from "@/hooks/useManager";
import { useTrade } from "@/hooks/useTrade";
import type { Direction, Quote } from "@/hooks/useQuote";
import { DUSDC } from "@/lib/constants";
import { openExternal } from "@/lib/openExternal";
import { cn } from "@/lib/cn";

const PRESETS = [10, 25, 50] as const;

/** dUSDC raw → display number. */
const toDusdc = (raw: bigint | number) => Number(raw) / 10 ** DUSDC.DECIMALS;

/** A 6-dec dUSDC figure that springs to its target over ~250ms. */
function Rolling({ value, digits = 2 }: { value: number; digits?: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { duration: 0.25, bounce: 0 });
  const text = useTransform(spring, (v) => v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }));
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

/** Bottom-right success toast with a Suiscan link to the mint tx. */
function MintToast({ digest, onClose }: { digest: string; onClose: () => void }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="lift-2 fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-hairline bg-surface-1 px-4 py-3"
      exit={{ opacity: 0, y: 8 }}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <Check aria-hidden className="size-4 shrink-0 text-success" />
      <div className="flex flex-col">
        <span className="text-sm text-ink">Position minted</span>
        <button
          className="flex items-center gap-1 text-xs text-accent outline-none hover:underline"
          type="button"
          onClick={() => openExternal(`https://suiscan.xyz/testnet/tx/${digest}`)}
        >
          View on Suiscan <ExternalLink className="size-3" />
        </button>
      </div>
      <Button isIconOnly aria-label="Dismiss" size="sm" variant="ghost" onPress={onClose}>
        <X className="size-3.5" />
      </Button>
    </motion.div>
  );
}

interface TicketPanelProps {
  oracleId: string | undefined;
  direction: Direction;
  onDirection: (d: Direction) => void;
  amount: number; // dUSDC display units
  onAmount: (v: number) => void;
  strike: number | undefined;
  expiry: number | undefined;
  quote: Quote | undefined;
  isFetching: boolean;
  error: Error | null;
}

/** Order ticket — direction halves, amount + presets, payout-explicit quote, one-click mint. */
export function TicketPanel(p: TicketPanelProps) {
  const { managerId, isPending: managerPending, create } = useManager();
  const { data: walletDusdc } = useDusdc();
  const { data: managerDusdc } = useManagerBalance(managerId);
  const { mint } = useTrade();
  const [digest, setDigest] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const spendable = toDusdc((walletDusdc ?? 0n) + (managerDusdc ?? 0n));
  const insufficient = p.quote !== undefined && toDusdc(p.quote.cost) > spendable;
  const ready =
    !!managerId &&
    !!p.oracleId &&
    p.expiry !== undefined &&
    p.strike !== undefined &&
    p.quote !== undefined &&
    !p.isFetching &&
    !p.error &&
    !insufficient;

  // Payout math straight off the quote: amountRaw pays 1 dUSDC/unit if right.
  const cost = p.quote ? toDusdc(p.quote.cost) : 0;
  const payout = p.quote ? toDusdc(p.quote.amountRaw) : 0;
  const prob = p.quote && payout > 0 ? (cost / payout) * 100 : null;
  const maxReturn = p.quote && cost > 0 ? ((payout - cost) / cost) * 100 : null;

  function onMint() {
    if (!managerId || !p.oracleId || p.expiry === undefined || p.strike === undefined || !p.quote) return;
    mint.mutate(
      {
        managerId,
        managerBalance: managerDusdc ?? 0n,
        oracleId: p.oracleId,
        expiry: p.expiry,
        strike: p.strike,
        direction: p.direction,
        amountRaw: BigInt(p.quote.amountRaw),
        costRaw: p.quote.cost,
      },
      {
        onSuccess: (d) => {
          setDigest(d);
          clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setDigest(null), 6_000);
        },
      },
    );
  }

  return (
    <div className="lift flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">Ticket</span>

      <div className="grid grid-cols-2 gap-2">
        {(["up", "down"] as const).map((d) => {
          const sel = p.direction === d;
          const up = d === "up";
          return (
            <button
              key={d}
              className={cn(
                "flex h-12 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-focus",
                sel
                  ? up
                    ? "border-success/60 bg-success/20 text-success"
                    : "border-danger/60 bg-danger/20 text-danger"
                  : "border-hairline bg-surface-2 text-ink-subtle hover:text-ink-muted",
              )}
              type="button"
              onClick={() => p.onDirection(d)}
            >
              {up ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              {up ? "Up" : "Down"}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-subtle">Amount · dUSDC</span>
          <NumberField aria-label="Amount (dUSDC)" minValue={1} value={p.amount} onChange={(v) => Number.isFinite(v) && p.onAmount(v)}>
            <NumberField.Group className="w-32">
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
        </div>
        <div className="flex gap-1">
          {PRESETS.map((v) => (
            <Button key={v} className="flex-1" size="sm" variant={p.amount === v ? "secondary" : "ghost"} onPress={() => p.onAmount(v)}>
              {v}
            </Button>
          ))}
          <Button
            className="flex-1"
            isDisabled={spendable < 1}
            size="sm"
            variant={p.amount === Math.floor(spendable) && spendable >= 1 ? "secondary" : "ghost"}
            onPress={() => p.onAmount(Math.max(1, Math.floor(spendable)))}
          >
            Max
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-surface-2 px-3 py-3">
        {p.error ? (
          <span className="text-xs text-danger">{p.error.message}</span>
        ) : p.quote ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-ink-subtle">Cost</span>
              <span className="flex items-center gap-1.5 text-lg font-semibold tabular-nums text-ink">
                <Rolling value={cost} /> <span className="text-xs font-normal text-ink-subtle">dUSDC</span>
                {p.isFetching && <Loader2 aria-hidden className="size-3 animate-spin text-ink-tertiary" />}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-ink-subtle">Payout if right</span>
              <span className="text-lg font-semibold tabular-nums text-success">
                <Rolling value={payout} /> <span className="text-xs font-normal text-ink-subtle">dUSDC</span>
              </span>
            </div>
            {prob !== null && maxReturn !== null && (
              <span className="text-[11px] tabular-nums text-ink-tertiary">
                ≈ {prob.toFixed(0)}% implied · +{maxReturn.toFixed(0)}% if right
              </span>
            )}
          </>
        ) : p.isFetching ? (
          <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
            <Loader2 aria-hidden className="size-3.5 animate-spin" /> pricing…
          </span>
        ) : (
          <span className="text-xs text-ink-subtle">Pick a strike side to price a position.</span>
        )}
      </div>

      {!managerId ? (
        <Button className="h-11 w-full" isDisabled={managerPending} isPending={create.isPending} onPress={() => create.mutate()}>
          {managerPending ? "Looking up account…" : "Create trading account"}
        </Button>
      ) : (
        <Button className="h-11 w-full text-base" isDisabled={!ready} isPending={mint.isPending} onPress={onMint}>
          {insufficient ? "Need more dUSDC" : `Mint ${p.direction === "up" ? "Up" : "Down"}`}
        </Button>
      )}
      {create.error && <span className="text-xs text-danger">{create.error.message}</span>}
      {mint.error && !mint.isPending && <span className="text-xs text-danger">{mint.error.message}</span>}

      <AnimatePresence>{digest && <MintToast digest={digest} onClose={() => setDigest(null)} />}</AnimatePresence>
    </div>
  );
}
