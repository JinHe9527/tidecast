# Tidecast

> A desktop trading console for **DeepBook Predict** — Sui's on-chain BTC prediction market, priced by a live SVI volatility surface. Built for the **Sui Overflow 2026 DeepBook track**.

Watch the live BTC vol surface, see where the market is positioned, and mint or redeem a binary position in two clicks — signed in-process by a local keypair, no wallet extension.

**Status: day 0** — write-path verified on testnet (PredictManager created, live SVI quote via devInspect). Scaffold landing next.

## How it works

```
Tidecast (Tauri 2.0 + Vite/React)
   │ local Ed25519 keypair — signs in-process
   ├─ Read    → predict-server.testnet.mystenlabs.com (oracles, SVI stream, positions, PnL)
   ├─ Quote   → devInspect predict::get_trade_amounts          (free, live)
   ├─ Trade   → PTB: deposit dUSDC → predict::mint<DUSDC>      (one click)
   └─ Settle  → predict::redeem<DUSDC> after oracle settlement
```

Stack: Tauri 2.0 · React 19 · HeroUI v3 · Tailwind v4 · @mysten/sui · bun.
