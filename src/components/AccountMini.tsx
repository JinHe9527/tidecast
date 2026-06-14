import { useDusdc } from "@/hooks/useDusdc";
import { useManager, useManagerBalance } from "@/hooks/useManager";
import { useSuiBalance } from "@/hooks/useSuiBalance";
import { fmtDusdc } from "@/lib/constants";

/** Compact balances strip for the left rail — wallet SUI + total spendable dUSDC. */
export function AccountMini() {
  const { data: sui } = useSuiBalance();
  const { data: walletDusdc } = useDusdc();
  const { managerId } = useManager();
  const { data: managerDusdc } = useManagerBalance(managerId);
  const dusdc = (walletDusdc ?? 0n) + (managerDusdc ?? 0n);
  const hasDusdc = walletDusdc !== undefined || managerDusdc !== undefined;

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-hairline bg-surface-1 px-3 py-2.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">Account</span>
      <div className="flex items-center justify-between gap-2 tabular-nums">
        <span className="text-xs text-ink-subtle">SUI</span>
        <span className="font-mono text-xs text-ink-muted">
          {sui === undefined ? "…" : sui.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 tabular-nums">
        <span className="text-xs text-ink-subtle">dUSDC</span>
        <span className="font-mono text-xs text-ink-muted">{hasDusdc ? fmtDusdc(dusdc) : "…"}</span>
      </div>
    </div>
  );
}
