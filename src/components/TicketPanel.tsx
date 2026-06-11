import { NumberField, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Direction, Quote } from "@/hooks/useQuote";
import { fmtDusdc, fmtUsd } from "@/lib/constants";

/** Single-key from a React Aria Selection. */
function firstKey(keys: Iterable<string | number>): string | undefined {
  const k = [...keys][0];
  return k == null ? undefined : String(k);
}

interface TicketPanelProps {
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

/** Order ticket — direction, amount, live devInspect quote. Mint lands D3. */
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
            Cost ≈ {fmtDusdc(p.quote.cost)} · payout if right ≈ {fmtDusdc(p.quote.amountRaw)}
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

      <Button isDisabled className="w-full">
        Mint (lands D3)
      </Button>
    </div>
  );
}
