import { useQuery } from "@tanstack/react-query";
import { PREDICT } from "@/lib/constants";

/** One rolling BTC oracle row from the predict server (wire shape, 9-dec fixed point). */
export interface Oracle {
  oracle_id: string;
  expiry: number; // unix ms
  min_strike: number;
  tick_size: number;
  status: string; // "created" | "active" | "settled" | …
  settlement_price: number | null;
}

// Server may emit large integers as strings — Number() handles both
// (spot/strike magnitudes ~6e13 fit float64 exactly).
async function fetchOracles(): Promise<Oracle[]> {
  const res = await fetch(`${PREDICT.SERVER}/predicts/${PREDICT.OBJECT}/oracles`);
  if (!res.ok) throw new Error(`oracles: HTTP ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    oracle_id: String(r.oracle_id),
    expiry: Number(r.expiry),
    min_strike: Number(r.min_strike),
    tick_size: Number(r.tick_size),
    status: String(r.status),
    settlement_price: r.settlement_price == null ? null : Number(r.settlement_price),
  }));
}

/** Active oracles sorted by expiry asc — the tradable expiries. */
export function useOracles() {
  return useQuery({
    queryKey: ["oracles"],
    queryFn: fetchOracles,
    refetchInterval: 30_000,
    select: (rows) =>
      rows.filter((o) => o.status === "active").sort((a, b) => a.expiry - b.expiry),
  });
}
