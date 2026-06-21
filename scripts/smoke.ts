// Live read-only smoke test — proves Tidecast's DeepBook Predict integration is
// real and reachable WITHOUT a wallet, funds, or any env config.
//   bun run smoke
// It hits the public Predict server for a live oracle + BTC spot, then runs a
// gas-free devInspect `get_trade_amounts` quote on Sui testnet (the exact call the
// app makes). Exits 0 on success, 1 on failure.

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";

const PACKAGE = "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138";
const PREDICT_OBJECT = "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a";
const SERVER = "https://predict-server.testnet.mystenlabs.com";
const CLOCK = "0x6";
// devInspect needs a sender but never touches its funds — any valid address works.
const SENDER = "0xce98556a6a7f924b32d8f4c03ac74d60c34447cff47856402f5bbcf97393a14f";
const PRICE_DECIMALS = 9;
const DUSDC_DECIMALS = 6;

const usd = (raw: number) =>
  `$${(raw / 10 ** PRICE_DECIMALS).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const dusdc = (raw: bigint) => `${(Number(raw) / 10 ** DUSDC_DECIMALS).toFixed(3)} dUSDC`;

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  console.log("Tidecast smoke — read-only · no wallet · no funds · no env\n");

  const oraclesRaw = await getJson(`${SERVER}/predicts/${PREDICT_OBJECT}/oracles`);
  const oracles: any[] = Array.isArray(oraclesRaw) ? oraclesRaw : (oraclesRaw.data ?? []);
  const now = Date.now();
  const active = oracles
    .filter((o) => o.status === "active" && o.expiry > now)
    .sort((a, b) => a.expiry - b.expiry);
  if (!active.length) throw new Error("no active oracle right now — oracles roll sub-hourly, retry shortly");
  const o = active[0];
  console.log(`✓ Predict server reachable — ${oracles.length} oracles, ${active.length} active`);
  console.log(`  using oracle ${o.oracle_id.slice(0, 12)}…  expires in ${Math.round((o.expiry - now) / 60000)}m`);

  const price = await getJson(`${SERVER}/oracles/${o.oracle_id}/prices/latest`);
  const spot = Number(price.spot ?? price.price ?? price.forward);
  if (!Number.isFinite(spot) || spot <= 0) throw new Error("no live spot price");
  console.log(`✓ live BTC spot ${usd(spot)}`);

  const tick = Number(o.tick_size);
  const atm = Math.max(Math.floor(spot / tick) * tick, Number(o.min_strike));
  const amountRaw = 10 * 10 ** DUSDC_DECIMALS;

  const client = new SuiClient({ url: getFullnodeUrl("testnet") });
  const tx = new Transaction();
  const key = tx.moveCall({
    target: `${PACKAGE}::market_key::up`,
    arguments: [tx.pure.id(o.oracle_id), tx.pure.u64(BigInt(o.expiry)), tx.pure.u64(BigInt(atm))],
  });
  tx.moveCall({
    target: `${PACKAGE}::predict::get_trade_amounts`,
    arguments: [tx.object(PREDICT_OBJECT), tx.object(o.oracle_id), key, tx.pure.u64(BigInt(amountRaw)), tx.object(CLOCK)],
  });
  const res = await client.devInspectTransactionBlock({ sender: SENDER, transactionBlock: tx });
  if (res.error) throw new Error(`devInspect failed: ${res.error}`);
  const ret = res.results?.at(-1)?.returnValues;
  if (!ret || ret.length < 1) throw new Error("devInspect returned no values");
  const cost = BigInt(bcs.u64().parse(Uint8Array.from(ret[0][0])));
  console.log(`✓ gas-free devInspect quote — UP @ ${usd(atm)} (ATM), 10 dUSDC`);
  console.log(`  cost ${dusdc(cost)} for a ${dusdc(BigInt(amountRaw))} payout if right\n`);

  console.log("✅ PASS — DeepBook Predict integration is live (REST reads + on-chain devInspect quote, no wallet).");
}

main().catch((e) => {
  console.error(`\n❌ FAIL — ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
