import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";
import { useWallet } from "@/stores/walletStore";

export type FaucetStatus = "idle" | "loading" | "ok" | "error";

/**
 * Request free testnet SUI for the active wallet. The public faucet API
 * rate-limits hard by IP (HTTP 429), so on error callers should offer
 * `webFaucetUrl` — the browser faucet has a captcha and works when the API
 * refuses.
 */
export function useFaucet() {
  const address = useWallet((s) => s.address);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const webFaucetUrl = address
    ? `https://faucet.sui.io/?address=${address}`
    : "https://faucet.sui.io/";

  const request = useCallback(async () => {
    if (!address) return false;
    setStatus("loading");
    try {
      await requestSuiFromFaucetV2({ host: getFaucetHost("testnet"), recipient: address });
      setStatus("ok");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["suiBalance"] }), 2_000);
      setTimeout(() => setStatus("idle"), 3_000);
      return true;
    } catch {
      // Almost always the per-IP rate limit — keep the error state until the
      // user acts so the web-faucet fallback stays visible.
      setStatus("error");
      return false;
    }
  }, [address, queryClient]);

  return { request, status, webFaucetUrl };
}
