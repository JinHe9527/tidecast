import { useRef, useState } from "react";
import { motion } from "motion/react";
import { NumberField, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Check, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDusdc } from "@/hooks/useDusdc";
import { useManager, useManagerBalance } from "@/hooks/useManager";
import { useTrade } from "@/hooks/useTrade";
import type { Direction, Quote } from "@/hooks/useQuote";
import { fmtDusdc, fmtUsd } from "@/lib/constants";

/** Single-key from a React Aria Selection. */
function firstKey(keys: Iterable<string | number>): string | undefined {
  const k = [...keys][0];
  return k == null ? undefined : String(k);
}

interface MintActionProps {
  oracleId: string | undefined;
  expiry: number | undefined;
  strike: number | undefined;
  direction: Direction;
  quote: Quote | undefined;
  quoteReady: boolean;
}

/** Manager bootstrap + balances + the Mint button — the write side of the ticket. */
function MintAction(p: MintActionProps) {
  const { managerId, isPending: managerPending, create } = useManager();
  const { data: walletDusdc } = useDusdc();
  const { data: managerDusdc } = useManagerBalance(managerId);
  const { mint } = useTrade();
  const [justMinted, setJustMinted] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const combined = (walletDusdc ?? 0n) + (managerDusdc ?? 0n);
  const insufficient = p.quote !== undefined && combined < p.quote.cost;
  const ready =
    !!managerId &&
    !!p.oracleId &&
    p.expiry !== undefined &&
    p.strike !== undefined &&
    p.quote !== undefined &&
    p.quoteReady &&
    !insufficient;

  function onMint() {
    if (!managerId || !p.oracleId || p.expiry === undefined || p.strike === undefined || !p.quote) {
      return;
    }
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
        onSuccess: () => {
          setJustMinted(true);
          clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setJustMinted(false), 2_500);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs tabular-nums text-ink-subtle">
        <span>Wallet {walletDusdc !== undefined ? fmtDusdc(walletDusdc) : "—"}</span>
        <span>Account {managerDusdc !== undefined ? fmtDusdc(managerDusdc) : "—"}</span>
      </div>
      {!managerId ? (
        <Button
          className="w-full"
          isDisabled={managerPending}
          isPending={create.isPending}
          onPress={() => create.mutate()}
        >
          {managerPending ? "Looking up trading account…" : "Create trading account"}
        </Button>
      ) : (
        <Button
          className="w-full"
          isDisabled={!ready || justMinted}
          isPending={mint.isPending}
          onPress={onMint}
        >
          {justMinted ? (
            <>
              <Check aria-hidden className="size-4" /> Minted
            </>
          ) : insufficient ? (
            "Need more dUSDC"
          ) : (
            `Mint ${p.direction === "up" ? "Up" : "Down"}`
          )}
        </Button>
      )}
      {create.error && <span className="text-xs text-danger">{create.error.message}</span>}
      {mint.error && !mint.isPending && (
        <span className="text-xs text-danger">{mint.error.message}</span>
      )}
    </div>
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

/** Order ticket — direction, amount, live devInspect quote, one-click mint. */
export function TicketPanel(p: TicketPanelProps) {
  const summary =
    p.strike !== undefined && p.expiry !== undefined
      ? `${p.direction === "up" ? "Up" : "Down"} from ${fmtUsd(p.strike)} · expires ${new Date(
          p.expiry,
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "Pick an expiry and a strike to price a position.";

  return (
    <div className="lift flex flex-col gap-4 rounded-xl border border-hairline bg-surface-1 p-4">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">Ticket</span>

      <ToggleButtonGroup
        aria-label="Direction"
        disallowEmptySelection
        selectedKeys={new Set([p.direction])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const k = firstKey(keys);
          if (k === "up" || k === "down") p.onDirection(k);
        }}
      >
        <ToggleButton className="flex-1 data-selected:bg-success/15 data-selected:text-success" id="up">
          <TrendingUp className="size-4" /> Up
        </ToggleButton>
        <ToggleButton className="flex-1 data-selected:bg-danger/15 data-selected:text-danger" id="down">
          <TrendingDown className="size-4" /> Down
        </ToggleButton>
      </ToggleButtonGroup>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-muted">Amount · dUSDC</span>
        <NumberField
          aria-label="Amount (dUSDC)"
          minValue={1}
          value={p.amount}
          onChange={(v) => Number.isFinite(v) && p.onAmount(v)}
        >
          <NumberField.Group className="w-36">
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
      </div>

      <div className="flex min-h-16 flex-col justify-center gap-1 rounded-lg bg-surface-2 px-3 py-2.5">
        <span className="text-xs text-ink-subtle">{summary}</span>
        {p.error ? (
          <span className="text-xs text-danger">{p.error.message}</span>
        ) : p.quote ? (
          <span className="flex items-center gap-1.5 text-sm tabular-nums text-ink">
            {/* keyed remount fades the new numbers in; transform-only, no layout shift */}
            <motion.span
              key={`${p.quote.cost}|${p.quote.amountRaw}`}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
              initial={{ opacity: 0.35, y: 2 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              Cost ≈ {fmtDusdc(p.quote.cost)} · payout if right ≈ {fmtDusdc(p.quote.amountRaw)}
            </motion.span>
            {p.isFetching && (
              <Loader2 aria-hidden className="size-3.5 animate-spin text-ink-subtle" />
            )}
          </span>
        ) : p.isFetching ? (
          <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
            <Loader2 aria-hidden className="size-3.5 animate-spin" /> pricing…
          </span>
        ) : null}
      </div>

      <MintAction
        direction={p.direction}
        expiry={p.expiry}
        oracleId={p.oracleId}
        quote={p.quote}
        quoteReady={!p.isFetching && !p.error}
        strike={p.strike}
      />
    </div>
  );
}
