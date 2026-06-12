import { useQuery } from "@tanstack/react-query";
import { suiClient } from "@/lib/sui";
import { useWallet } from "@/stores/walletStore";

const MIST_PER_SUI = 1_000_000_000;

/** SUI gas balance (in SUI, not MIST) for the active wallet, polled. */
export function useSuiBalance() {
  const address = useWallet((s) => s.address);
  return useQuery({
    queryKey: ["suiBalance", address],
    enabled: !!address,
    refetchInterval: 15_000,
    queryFn: async () => {
      if (!address) throw new Error("suiBalance: no wallet");
      const { totalBalance } = await suiClient.getBalance({ owner: address });
      return Number(totalBalance) / MIST_PER_SUI;
    },
  });
}
