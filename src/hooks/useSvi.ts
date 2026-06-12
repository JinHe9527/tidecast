import { useQuery } from "@tanstack/react-query";
import { PREDICT } from "@/lib/constants";

// SVI params arrive as unsigned fixed-point integers with sign split into
// *_negative flags. Scale inferred from live data (2026-06-12): rho_raw
// 940010306 must land in [-1, 1], which forces ÷1e9 — the protocol-wide 9-dec
// convention. The same scale on a/b/m/sigma gives ATM IV ≈ 33% annualized for
// BTC (plausible), while e.g. 1e6 would give ~1000% (absurd). So: all five
// params are 9-decimal fixed point.
const SVI_SCALE = 1e9;

export interface SviParams {
  a: number;
  b: number;
  rho: number;
  m: number;
  sigma: number;
  timestamp: number; // onchain unix ms
}

async function fetchSvi(oracleId: string): Promise<SviParams> {
  const res = await fetch(`${PREDICT.SERVER}/oracles/${oracleId}/svi/latest`);
  if (!res.ok) throw new Error(`svi: HTTP ${res.status}`);
  const row = (await res.json()) as Record<string, unknown>;
  return {
    a: Number(row.a) / SVI_SCALE,
    b: Number(row.b) / SVI_SCALE,
    rho: ((row.rho_negative ? -1 : 1) * Number(row.rho)) / SVI_SCALE,
    m: ((row.m_negative ? -1 : 1) * Number(row.m)) / SVI_SCALE,
    sigma: Number(row.sigma) / SVI_SCALE,
    timestamp: Number(row.onchain_timestamp),
  };
}

/** Latest SVI fit for an oracle — the params behind every quote. */
export function useSvi(oracleId: string | undefined) {
  return useQuery({
    queryKey: ["svi", oracleId],
    queryFn: () => {
      if (!oracleId) throw new Error("svi: no oracle");
      return fetchSvi(oracleId);
    },
    enabled: !!oracleId,
    refetchInterval: 10_000,
  });
}

/** Raw SVI total variance w(k) = a + b·(rho·(k−m) + sqrt((k−m)² + sigma²)). */
export function totalVariance(p: SviParams, k: number): number {
  return p.a + p.b * (p.rho * (k - p.m) + Math.sqrt((k - p.m) ** 2 + p.sigma ** 2));
}

/** Annualized implied vol at a strike (NaN when the fit is degenerate). */
export function impliedVol(
  p: SviParams,
  strike: number,
  forward: number,
  yearsToExpiry: number,
): number {
  const w = totalVariance(p, Math.log(strike / forward));
  if (!(w > 0) || !(yearsToExpiry > 0)) return NaN;
  return Math.sqrt(w / yearsToExpiry);
}
