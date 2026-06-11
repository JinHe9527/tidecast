import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

/**
 * Local desktop wallet — no browser extension. This app signs Sui transactions
 * with an Ed25519 keypair held in-process. The secret (bech32 `suiprivkey1...`)
 * is persisted in localStorage by walletStore; OS-keychain storage is Roadmap.
 */

/** Turn a bech32 `suiprivkey1...` secret into a usable keypair. Throws if malformed. */
export function loadKeypairFromSuiPrivkey(suiPrivkey: string): Ed25519Keypair {
  return Ed25519Keypair.fromSecretKey(suiPrivkey.trim());
}

/** Generate a brand-new Ed25519 wallet. */
export function generateKeypair(): Ed25519Keypair {
  return Ed25519Keypair.generate();
}

/** The bech32 `suiprivkey1...` secret for a keypair — for export and persistence. */
export function exportSuiPrivkey(keypair: Ed25519Keypair): string {
  return keypair.getSecretKey();
}
