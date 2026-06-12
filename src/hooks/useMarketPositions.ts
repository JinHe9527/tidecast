import { useQuery } from "@tanstack/react-query";
import { PREDICT } from "@/lib/constants";

/** Market-wide minted quantity per strike (6-dec raw, strike 9-dec on the tick grid). */
export interface StrikeBucket {
  strike: number;
  up: number;
  down: number;
}

export interface MarketPositions {
  buckets: StrikeBucket[]; // sorted high strike first, ladder orientation
  totalQty: number; // 6-dec raw, all mints on this oracle
}

// The unfiltered endpoint caps at 100 rows across all oracles — always filter
// server-side by oracle_id so one expiry's mints arrive complete.
async function fetchMinted(oracleId: string): Promise<MarketPositions> {
  const res = await fetch(`${PREDICT.SERVER}/positions/minted?oracle_id=${oracleId}`);
  if (!res.ok) throw new Error(`minted: HTTP ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  const byStrike = new Map<number, StrikeBucket>();
  let totalQty = 0;
  for (const r of rows) {
    const strike = Number(r.strike);
    const qty = Number(r.quantity);
    totalQty += qty;
    const b = byStrike.get(strike) ?? { strike, up: 0, down: 0 };
    if (r.is_up) b.up += qty;
    else b.down += qty;
    byStrike.set(strike, b);
  }
  return {
    buckets: [...byStrike.values()].sort((a, b) => b.strike - a.strike),
    totalQty,
  };
}

/** Everyone's mints on this oracle, bucketed by strike — where the market sits. */
export function useMarketPositions(oracleId: string | undefined) {
  return useQuery({
    queryKey: ["minted", oracleId],
    queryFn: () => {
      if (!oracleId) throw new Error("minted: no oracle");
      return fetchMinted(oracleId);
    },
    enabled: !!oracleId,
    refetchInterval: 30_000,
  });
}
