import { useQuery } from "@tanstack/react-query";
import { suiClient } from "@/lib/sui";
import { DUSDC } from "@/lib/constants";
import { useWallet } from "@/stores/walletStore";

/** Wallet dUSDC balance (6-dec raw) — the spendable side of the ticket. */
export function useDusdc() {
  const address = useWallet((s) => s.address);
  return useQuery({
    queryKey: ["dusdc", address],
    enabled: !!address,
    refetchInterval: 15_000,
    queryFn: async () => {
      if (!address) throw new Error("dusdc: no wallet");
      const res = await suiClient.getBalance({ owner: address, coinType: DUSDC.TYPE });
      return BigInt(res.totalBalance);
    },
  });
}
