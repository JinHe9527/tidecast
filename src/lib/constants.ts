// Frontend constants — Vite reads import.meta.env.VITE_*.
// All on-chain facts verified by execution on 2026-06-11 (see CLAUDE.md).

export type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";
export const SUI_NETWORK = (import.meta.env.VITE_SUI_NETWORK ?? "testnet") as SuiNetwork;

/** DeepBook Predict deployment (testnet). */
export const PREDICT = {
  PACKAGE: "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138",
  /** The shared Predict object every call takes &mut on. */
  OBJECT: "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a",
  REGISTRY: "0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64",
  /** Official public read-only indexer. */
  SERVER: "https://predict-server.testnet.mystenlabs.com",
} as const;

/** Quote asset: 6-decimal dUSDC (no public mint — request via form/community). */
export const DUSDC = {
  TYPE: "0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC",
  DECIMALS: 6,
} as const;

/** Oracle prices & strikes are 9-decimal fixed point (62575368041947 = $62,575.368). */
export const PRICE_DECIMALS = 9;

export const SUI_CLOCK_ID = "0x6";

/** Local desktop wallet secret (suiprivkey1...) — seeds the wallet on first run. */
export const TIDECAST_KEYPAIR = import.meta.env.VITE_TIDECAST_KEYPAIR ?? "";

/** Funded test wallet — devInspect sender fallback before the local wallet loads. */
export const TEST_WALLET = "0xce98556a6a7f924b32d8f4c03ac74d60c34447cff47856402f5bbcf97393a14f";

export const fmtUsd = (raw: bigint | number, digits = 0): string =>
  `$${(Number(raw) / 10 ** PRICE_DECIMALS).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;

export const fmtDusdc = (raw: bigint | number, digits = 2): string =>
  `${(Number(raw) / 10 ** DUSDC.DECIMALS).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} dUSDC`;
