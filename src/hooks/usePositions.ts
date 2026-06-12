import { useQuery } from "@tanstack/react-query";
import { suiClient } from "@/lib/sui";
import { PREDICT, TEST_WALLET } from "@/lib/constants";
import { fetchQuote, type Direction } from "@/hooks/useQuote";
import { useWallet } from "@/stores/walletStore";

/**
 * Positions come from the indexer's mint/redeem event streams filtered by manager
 * (`/managers/:id/positions/summary` 500s — "missing mark quote results" — once a
 * manager holds positions, so it is unusable). Net size per market key =
 * minted − redeemed.
 */

/** One row of /positions/minted (PositionMinted event). */
interface MintedRow {
  oracle_id: string;
  expiry: number;
  strike: number;
  is_up: boolean;
  quantity: number; // 6-dec position units
  cost: number; // 6-dec dUSDC paid
  checkpoint_timestamp_ms: number;
}

/** One row of /positions/redeemed (PositionRedeemed event). */
interface RedeemedRow {
  oracle_id: string;
  expiry: number;
  strike: number;
  is_up: boolean;
  quantity: number;
  payout: number;
}

export interface Position {
  key: string; // oracleId|expiry|strike|direction
  oracleId: string;
  expiry: number;
  strike: number; // 9-dec fixed point
  direction: Direction;
  quantity: number; // net open size, 6-dec raw
  cost: number; // cost basis for the open size, 6-dec raw
}

async function fetchRows<T>(path: string): Promise<T[]> {
  const res = await fetch(`${PREDICT.SERVER}${path}`);
  if (!res.ok) throw new Error(`positions: HTTP ${res.status}`);
  return (await res.json()) as T[];
}

function aggregate(minted: MintedRow[], redeemed: RedeemedRow[]): Position[] {
  const open = new Map<string, Position & { mintedQty: number }>();
  for (const r of minted) {
    const direction: Direction = r.is_up ? "up" : "down";
    const key = `${r.oracle_id}|${r.expiry}|${r.strike}|${direction}`;
    const p = open.get(key) ?? {
      key,
      oracleId: String(r.oracle_id),
      expiry: Number(r.expiry),
      strike: Number(r.strike),
      direction,
      quantity: 0,
      cost: 0,
      mintedQty: 0,
    };
    p.mintedQty += Number(r.quantity);
    p.quantity += Number(r.quantity);
    p.cost += Number(r.cost);
    open.set(key, p);
  }
  for (const r of redeemed) {
    const key = `${r.oracle_id}|${r.expiry}|${r.strike}|${r.is_up ? "up" : "down"}`;
    const p = open.get(key);
    if (p) p.quantity -= Number(r.quantity);
  }
  return [...open.values()]
    .filter((p) => p.quantity > 0)
    .map(({ mintedQty, ...p }) => ({
      ...p,
      // cost basis scales with what is still open after partial redeems
      cost: Math.round(p.cost * (p.quantity / mintedQty)),
    }))
    .sort((a, b) => a.expiry - b.expiry);
}

/** Open positions for a manager, nearest expiry first. */
export function usePositions(managerId: string | null) {
  return useQuery({
    queryKey: ["positions", managerId],
    enabled: !!managerId,
    refetchInterval: 10_000,
    queryFn: async () => {
      if (!managerId) throw new Error("positions: no manager");
      const [minted, redeemed] = await Promise.all([
        fetchRows<MintedRow>(`/positions/minted?manager_id=${managerId}`),
        fetchRows<RedeemedRow>(`/positions/redeemed?manager_id=${managerId}`),
      ]);
      return aggregate(minted, redeemed);
    },
  });
}

/**
 * Settlement prices for expired oracles, read from the OracleSVI objects
 * (no single-oracle REST endpoint; the full list is 3800+ rows). null = not settled yet.
 */
export function useSettlements(oracleIds: string[]) {
  return useQuery({
    queryKey: ["settlements", ...oracleIds],
    enabled: oracleIds.length > 0,
    refetchInterval: 15_000,
    queryFn: async () => {
      const res = await suiClient.multiGetObjects({
        ids: oracleIds,
        options: { showContent: true },
      });
      const map: Record<string, number | null> = {};
      for (const obj of res) {
        const content = obj.data?.content;
        if (!obj.data || content?.dataType !== "moveObject") continue;
        const fields = content.fields as Record<string, unknown>;
        map[obj.data.objectId] =
          fields.settlement_price == null ? null : Number(fields.settlement_price);
      }
      return map;
    },
  });
}

export type PositionStatus = "active" | "settling" | "won" | "lost";

/** Display status only — the chain decides the actual payout at redeem. */
export function positionStatus(
  p: Position,
  now: number,
  settlement: number | null | undefined,
): PositionStatus {
  if (p.expiry > now) return "active";
  if (settlement == null) return "settling";
  const won = p.direction === "up" ? settlement >= p.strike : settlement < p.strike;
  return won ? "won" : "lost";
}

/** Est. sell-back value of an active position — the bid side of get_trade_amounts. */
export function usePositionValue(p: Position, enabled: boolean) {
  const address = useWallet((s) => s.address);
  return useQuery({
    queryKey: ["positionValue", p.key, p.quantity],
    enabled,
    refetchInterval: 10_000,
    retry: 1,
    queryFn: () =>
      fetchQuote(address ?? TEST_WALLET, {
        oracleId: p.oracleId,
        expiry: p.expiry,
        strike: p.strike,
        direction: p.direction,
        amountRaw: p.quantity,
      }),
    select: (q) => q.alt,
  });
}
