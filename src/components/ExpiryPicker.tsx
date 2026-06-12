import { useEffect, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Loader2 } from "lucide-react";
import type { Oracle } from "@/hooks/useOracles";

/** Single-key from a React Aria Selection. */
function firstKey(keys: Iterable<string | number>): string | undefined {
  const k = [...keys][0];
  return k == null ? undefined : String(k);
}

/** "in 43 min" when close, local HH:MM today, date + time beyond 24h. */
export function expiryLabel(expiry: number, now: number): string {
  const mins = Math.round((expiry - now) / 60_000);
  if (mins <= 0) return "expiring";
  if (mins < 60) return `in ${mins} min`;
  const t = new Date(expiry);
  const hm = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (expiry - now < 24 * 60 * 60_000) return hm;
  return `${t.toLocaleDateString([], { month: "short", day: "numeric" })} ${hm}`;
}

interface ExpiryPickerProps {
  oracles: Oracle[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  isPending: boolean;
  isError: boolean;
}

/** Rolling hourly expiries — one toggle per live oracle. */
export function ExpiryPicker({ oracles, selectedId, onSelect, isPending, isError }: ExpiryPickerProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">Expiry</span>
      {isPending ? (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : oracles.length === 0 ? (
        isError ? (
          <span className="flex items-center gap-1.5 text-sm text-ink-subtle">
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
            Predict server unreachable — retrying…
          </span>
        ) : (
          <span className="text-sm text-ink-subtle">
            Markets are rolling over — back in a minute.
          </span>
        )
      ) : (
        <ToggleButtonGroup
          aria-label="Expiry"
          className="flex-wrap"
          disallowEmptySelection
          selectedKeys={new Set(selectedId ? [selectedId] : [])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            const k = firstKey(keys);
            if (k) onSelect(k);
          }}
        >
          {oracles.map((o) => (
            <ToggleButton key={o.oracle_id} className="tabular-nums" id={o.oracle_id}>
              {expiryLabel(o.expiry, now)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
    </div>
  );
}
