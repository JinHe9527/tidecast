import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Oracle } from "@/hooks/useOracles";
import { cn } from "@/lib/cn";

/** Local HH:MM for an expiry. */
function clockLabel(expiry: number): string {
  return new Date(expiry).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** "in 43m" when close, local HH:MM today, date + time beyond 24h. */
export function expiryLabel(expiry: number, now: number): string {
  const mins = Math.round((expiry - now) / 60_000);
  if (mins <= 0) return "expiring";
  if (mins < 60) return `in ${mins}m`;
  const hm = clockLabel(expiry);
  if (expiry - now < 24 * 60 * 60_000) return hm;
  return `${new Date(expiry).toLocaleDateString([], { month: "short", day: "numeric" })} ${hm}`;
}

/** Short countdown for the rail row: "43m" / "2h 10m". */
function countdown(expiry: number, now: number): string {
  const mins = Math.max(0, Math.round((expiry - now) / 60_000));
  if (mins === 0) return "expiring";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

interface ExpiryPickerProps {
  oracles: Oracle[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  isPending: boolean;
  isError: boolean;
}

/** Rolling hourly expiries as a vertical rail — one row per live oracle. */
export function ExpiryPicker({ oracles, selectedId, onSelect, isPending, isError }: ExpiryPickerProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      <span className="px-1 text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">Expiry</span>
      {isPending ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      ) : oracles.length === 0 ? (
        isError ? (
          <span className="flex items-center gap-1.5 px-1 text-xs text-ink-subtle">
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
            Server unreachable — retrying…
          </span>
        ) : (
          <span className="px-1 text-xs text-ink-subtle">Markets rolling over…</span>
        )
      ) : (
        <div aria-label="Expiry" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto" role="listbox">
          {oracles.map((o) => {
            const selected = o.oracle_id === selectedId;
            return (
              <button
                key={o.oracle_id}
                aria-selected={selected}
                className={cn(
                  "relative flex h-11 flex-col justify-center rounded-md pl-3.5 pr-2 text-left outline-none transition-colors",
                  "hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-focus",
                  selected && "bg-accent/10",
                )}
                role="option"
                type="button"
                onClick={() => onSelect(o.oracle_id)}
              >
                {selected && (
                  <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    selected ? "text-accent" : "text-ink-muted",
                  )}
                >
                  {clockLabel(o.expiry)}
                </span>
                <span className="text-[11px] tabular-nums text-ink-tertiary">{countdown(o.expiry, now)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
