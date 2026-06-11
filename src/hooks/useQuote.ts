import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import { suiClient } from "@/lib/sui";
import { PREDICT, SUI_CLOCK_ID, TEST_WALLET } from "@/lib/constants";
import { useWallet } from "@/stores/walletStore";

export type Direction = "up" | "down";

/** get_trade_amounts result — 6-dec dUSDC raw, tagged with the amount it priced. */
export interface Quote {
  cost: bigint;
  alt: bigint;
  amountRaw: number;
}

interface QuoteParams {
  oracleId: string | undefined;
  expiry: number | undefined; // the oracle's exact expiry ms
  strike: number | undefined; // 9-dec fixed point
  direction: Direction;
  amountRaw: number; // 6-dec dUSDC raw
}

async function fetchQuote(
  sender: string,
  p: { oracleId: string; expiry: number; strike: number; direction: Direction; amountRaw: number },
): Promise<Quote> {
  const tx = new Transaction();
  const key = tx.moveCall({
    target: `${PREDICT.PACKAGE}::market_key::${p.direction}`,
    arguments: [
      tx.pure.id(p.oracleId),
      tx.pure.u64(BigInt(p.expiry)),
      tx.pure.u64(BigInt(p.strike)),
    ],
  });
  tx.moveCall({
    target: `${PREDICT.PACKAGE}::predict::get_trade_amounts`,
    arguments: [
      tx.object(PREDICT.OBJECT),
      tx.object(p.oracleId),
      key,
      tx.pure.u64(BigInt(p.amountRaw)),
      tx.object(SUI_CLOCK_ID),
    ],
  });
  const res = await suiClient.devInspectTransactionBlock({ sender, transactionBlock: tx });
  if (res.error) throw new Error(`quote failed: ${res.error}`);
  const ret = res.results?.at(-1)?.returnValues;
  if (!ret || ret.length < 2) throw new Error("quote failed: no return values");
  const [cost, alt] = ret.map(([bytes]) => BigInt(bcs.u64().parse(Uint8Array.from(bytes))));
  return { cost, alt, amountRaw: p.amountRaw };
}

/** Free live quote via devInspect — no gas, no signature. */
export function useQuote({ oracleId, expiry, strike, direction, amountRaw }: QuoteParams) {
  const address = useWallet((s) => s.address);
  const sender = address ?? TEST_WALLET;
  return useQuery({
    queryKey: ["quote", oracleId, expiry, strike, direction, amountRaw],
    enabled: !!oracleId && expiry !== undefined && strike !== undefined && amountRaw > 0,
    placeholderData: keepPreviousData,
    retry: 1,
    queryFn: () => {
      if (!oracleId || expiry === undefined || strike === undefined) {
        throw new Error("quote: params incomplete");
      }
      return fetchQuote(sender, { oracleId, expiry, strike, direction, amountRaw });
    },
  });
}

/** Trailing debounce — quote inputs settle 400ms after the last keystroke. */
export function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
