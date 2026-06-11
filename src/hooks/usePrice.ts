import { useQuery } from "@tanstack/react-query";
import { PREDICT } from "@/lib/constants";

/** Latest oracle print — 9-dec fixed point USD. */
export interface OraclePrice {
  spot: number;
  forward: number;
  timestamp: number; // onchain unix ms
}

async function fetchPrice(oracleId: string): Promise<OraclePrice> {
  const res = await fetch(`${PREDICT.SERVER}/oracles/${oracleId}/prices/latest`);
  if (!res.ok) throw new Error(`price: HTTP ${res.status}`);
  const row = (await res.json()) as Record<string, unknown>;
  return {
    spot: Number(row.spot),
    forward: Number(row.forward),
    timestamp: Number(row.onchain_timestamp),
  };
}

export function usePrice(oracleId: string | undefined) {
  return useQuery({
    queryKey: ["price", oracleId],
    queryFn: () => {
      if (!oracleId) throw new Error("price: no oracle");
      return fetchPrice(oracleId);
    },
    enabled: !!oracleId,
    refetchInterval: 5_000,
  });
}
