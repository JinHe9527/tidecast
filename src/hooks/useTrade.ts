import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { suiClient } from "@/lib/sui";
import { DUSDC, PREDICT, SUI_CLOCK_ID } from "@/lib/constants";
import { useWallet } from "@/stores/walletStore";
import type { Direction } from "@/hooks/useQuote";

export interface MintParams {
  managerId: string;
  managerBalance: bigint; // current manager dUSDC — decides the deposit shortfall
  oracleId: string;
  expiry: number;
  strike: number;
  direction: Direction;
  amountRaw: bigint; // position size (6-dec) — pays 1 dUSDC per unit if right
  costRaw: bigint; // quoted mint cost (6-dec)
}

export interface RedeemParams {
  managerId: string;
  oracleId: string;
  expiry: number;
  strike: number;
  direction: Direction;
  amountRaw: bigint;
}

/** Plain-language tx errors: gas → faucet hint, MoveAbort → surfaced code. */
function friendlyTxError(raw: string): string {
  if (/MoveAbort/.test(raw)) {
    const fn = /function_name: Some\("(\w+)"\)/.exec(raw)?.[1];
    // balance_manager::withdraw_with_proof code 3 = manager balance too low,
    // i.e. the cost moved past the deposited headroom (verified by execution).
    if (fn === "withdraw_with_proof") {
      return "The price moved past the deposited headroom — re-quote and mint again.";
    }
    const code = /MoveAbort\(.*?,\s*(\d+)\)/.exec(raw)?.[1];
    return `Trade aborted on-chain${fn ? ` in ${fn}` : ""}${
      code ? ` (code ${code})` : ""
    } — the price may have moved; re-quote and try again.`;
  }
  if (/gas|InsufficientCoinBalance/i.test(raw)) {
    return "Not enough SUI for gas — top up this wallet at faucet.sui.io and retry.";
  }
  if (/satisfy requested balance|No coins/i.test(raw)) {
    return "Not enough dUSDC in the wallet to cover the deposit.";
  }
  return raw;
}

/** Build the MarketKey in-PTB and return the mint/redeem call argument. */
function marketKey(
  tx: Transaction,
  p: { oracleId: string; expiry: number; strike: number; direction: Direction },
) {
  return tx.moveCall({
    target: `${PREDICT.PACKAGE}::market_key::${p.direction}`,
    arguments: [tx.pure.id(p.oracleId), tx.pure.u64(BigInt(p.expiry)), tx.pure.u64(BigInt(p.strike))],
  });
}

/**
 * Trade write-path. mint = one PTB: deposit the dUSDC shortfall into the manager
 * (if any), then predict::mint against the oracle. redeem = predict::redeem;
 * payout lands in the manager balance.
 */
export function useTrade() {
  const keypair = useWallet((s) => s.keypair);
  const queryClient = useQueryClient();

  async function execute(tx: Transaction): Promise<string> {
    if (!keypair) throw new Error("No wallet loaded.");
    let res;
    try {
      res = await suiClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true },
      });
    } catch (e) {
      throw new Error(friendlyTxError(e instanceof Error ? e.message : String(e)));
    }
    await suiClient.waitForTransaction({ digest: res.digest });
    const status = res.effects?.status;
    if (status?.status !== "success") {
      throw new Error(friendlyTxError(status?.error ?? "Transaction failed."));
    }
    return res.digest;
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["positions"] });
    queryClient.invalidateQueries({ queryKey: ["managerBalance"] });
    queryClient.invalidateQueries({ queryKey: ["dusdc"] });
  }

  const mint = useMutation({
    mutationFn: async (p: MintParams) => {
      const tx = new Transaction();
      // 10% headroom over the quote: mint charges whatever the curve says at execution,
      // and near-expiry ATM binaries move several % in seconds (a 2% buffer aborted in
      // testing). The deposit doubles as a slippage cap — mint can never take more than
      // the manager holds — and any unspent headroom stays withdrawable in the manager.
      const target = (p.costRaw * 110n + 99n) / 100n;
      if (target > p.managerBalance) {
        tx.moveCall({
          target: `${PREDICT.PACKAGE}::predict_manager::deposit`,
          typeArguments: [DUSDC.TYPE],
          arguments: [
            tx.object(p.managerId),
            coinWithBalance({ type: DUSDC.TYPE, balance: target - p.managerBalance }),
          ],
        });
      }
      tx.moveCall({
        target: `${PREDICT.PACKAGE}::predict::mint`,
        typeArguments: [DUSDC.TYPE],
        arguments: [
          tx.object(PREDICT.OBJECT),
          tx.object(p.managerId),
          tx.object(p.oracleId),
          marketKey(tx, p),
          tx.pure.u64(p.amountRaw),
          tx.object(SUI_CLOCK_ID),
        ],
      });
      return execute(tx);
    },
    onSuccess: refresh,
  });

  const redeem = useMutation({
    mutationFn: async (p: RedeemParams) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PREDICT.PACKAGE}::predict::redeem`,
        typeArguments: [DUSDC.TYPE],
        arguments: [
          tx.object(PREDICT.OBJECT),
          tx.object(p.managerId),
          tx.object(p.oracleId),
          marketKey(tx, p),
          tx.pure.u64(p.amountRaw),
          tx.object(SUI_CLOCK_ID),
        ],
      });
      return execute(tx);
    },
    onSuccess: refresh,
  });

  return { mint, redeem };
}
