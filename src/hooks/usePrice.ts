import { useEffect, useState } from "react";
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

const HISTORY_CAP = 40;
// Recent-spot ring buffer per oracle — feeds the header sparkline. Module-level so
// it survives re-renders; usePrice appends each distinct print, capped.
const spotHistory = new Map<string, number[]>();

function pushSpot(oracleId: string, spot: number) {
  const buf = spotHistory.get(oracleId) ?? [];
  if (buf.at(-1) === spot) return buf; // same print, no churn
  const next = [...buf, spot].slice(-HISTORY_CAP);
  spotHistory.set(oracleId, next);
  return next;
}

export function usePrice(oracleId: string | undefined) {
  return useQuery({
    queryKey: ["price", oracleId],
    queryFn: async () => {
      if (!oracleId) throw new Error("price: no oracle");
      const price = await fetchPrice(oracleId);
      pushSpot(oracleId, price.spot);
      return price;
    },
    enabled: !!oracleId,
    refetchInterval: 5_000,
  });
}

/** Recent spot prints for the active oracle (oldest→newest) — the header sparkline. */
export function useSpotHistory(oracleId: string | undefined, latestSpot: number | undefined) {
  const [series, setSeries] = useState<number[]>(() =>
    oracleId ? (spotHistory.get(oracleId) ?? []) : [],
  );
  // Re-sync whenever a new print lands (latestSpot changes) or the oracle rolls.
  useEffect(() => {
    setSeries(oracleId ? (spotHistory.get(oracleId) ?? []) : []);
  }, [oracleId, latestSpot]);
  return series;
}
