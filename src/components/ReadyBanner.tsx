import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Droplet, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDusdc } from "@/hooks/useDusdc";
import { useFaucet } from "@/hooks/useFaucet";
import { useManager, useManagerBalance } from "@/hooks/useManager";
import { useSuiBalance } from "@/hooks/useSuiBalance";
import { useWallet } from "@/stores/walletStore";
import { openExternal } from "@/lib/openExternal";

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
      initial={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Readiness nudges above the trading grid: a fresh wallet first needs SUI for
 * gas (free faucet, web fallback when the API rate-limits), then dUSDC to
 * trade — which has no public faucet, so we say so honestly.
 */
export function ReadyBanner() {
  const address = useWallet((s) => s.address);
  const { data: sui, isLoading: suiLoading } = useSuiBalance();
  const { data: walletDusdc, isLoading: dusdcLoading } = useDusdc();
  const { managerId } = useManager();
  const { data: managerDusdc, isLoading: managerLoading } = useManagerBalance(managerId);
  const faucet = useFaucet();
  const [copied, setCopied] = useState(false);

  if (!address || suiLoading || dusdcLoading || (managerId && managerLoading)) return null;

  if ((sui ?? 0) === 0) {
    const failed = faucet.status === "error";
    return (
      <Banner>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm text-ink">
            {failed ? "The faucet API is rate-limited right now." : "Your wallet needs gas."}
          </span>
          <span className="text-xs text-ink-subtle">
            {failed
              ? "Open the web faucet instead — it has a captcha and works. Your address is pre-filled."
              : "Every mint and redeem is a Sui transaction, which costs a little SUI. Testnet SUI is free."}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {failed && (
            <Button size="sm" variant="primary" onPress={() => openExternal(faucet.webFaucetUrl)}>
              <ExternalLink className="size-3.5" /> Open web faucet
            </Button>
          )}
          <Button
            isDisabled={faucet.status === "loading"}
            size="sm"
            variant={failed ? "secondary" : "primary"}
            onPress={faucet.request}
          >
            {faucet.status === "loading" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : faucet.status === "ok" ? (
              <Check className="size-3.5" />
            ) : (
              <Droplet className="size-3.5" />
            )}
            {faucet.status === "ok" ? "On its way" : failed ? "Retry" : "Get free test SUI"}
          </Button>
        </div>
      </Banner>
    );
  }

  if ((walletDusdc ?? 0n) + (managerDusdc ?? 0n) === 0n) {
    return (
      <Banner>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm text-ink">Trading needs testnet dUSDC — it has no public faucet.</span>
          <span className="text-xs text-ink-subtle">
            Request it via the DeepBook Predict token form or the Sui Discord; it arrives at your
            wallet address. Quotes and charts work without it.
          </span>
        </div>
        <Button
          className="shrink-0"
          size="sm"
          variant="secondary"
          onPress={async () => {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1_500);
          }}
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy address"}
        </Button>
      </Banner>
    );
  }

  return null;
}
