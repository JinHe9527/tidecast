# Tidecast

<p align="center">
  <img src="icons/logo-1024.png" alt="Tidecast logo" width="160" height="160">
</p>

**The trading desk for DeepBook Predict** — Sui's on-chain BTC prediction market, priced by a live SVI volatility surface. Most front-ends on Predict give you a bet button; Tidecast gives you the desk — watch the volatility surface move, read where the market is positioned across every strike, and mint or redeem in two clicks. Built for the Sui Overflow 2026 DeepBook track.

Tidecast is a cross-platform desktop app (Tauri 2.0 + React). It signs transactions in-process with a local Ed25519 keypair — no wallet extension, no popups.

> Tidecast ships no Move package of its own — it is a pure integration: the on-chain logic *is* DeepBook Predict, called through its public entry functions.

![Tidecast — the live volatility smile, strike ladder, order ticket and positions in one terminal](submission/media/01-terminal.gif)

## Features

- **Live oracle price** — BTC spot streamed from the Predict REST server
- **Rolling expiries** — oracles roll sub-hourly; pick one from the expiry rail
- **Strike ladder** — strikes laid out around spot, tick-aligned
- **Free live quotes** — `predict::get_trade_amounts` via `devInspect`: no gas, re-quoted as you type
- **One-click mint / redeem** — one PTB (deposit dUSDC if needed → mint), signed in-process
- **Positions with est. PnL** — open positions marked against the latest quote
- **Live vol smile** — SVI params rendered as an IV curve per expiry, updating on every tick
- **Market positioning heatmap** — strike × expiry minted volume: where everyone is betting
- **Onboarding + gas guidance** — generate or import a wallet, SUI faucet hints, dUSDC balance check

## How it works

```
Tidecast (Tauri 2.0 + Vite/React — local Ed25519 keypair, in-process signing)
   │
   ├─ read   → REST  predict-server.testnet.mystenlabs.com
   │                 oracles · SVI stream · prices · trades · positions · PnL
   ├─ quote  → Sui devInspect  predict::get_trade_amounts     (free, live)
   └─ write  → Sui PTB  deposit<DUSDC> → predict::mint / redeem   (one click)
```

No backend of our own: reads come from the public Predict server, quotes and writes go straight to Sui testnet.

## Proof

Real on-chain integration, verified on testnet:

| What | Link |
|---|---|
| Real mint, tx digest `8wDTPzWhoq9YKVT95nVKJnBjqmMkPF1UNKCxvgiZmUif` | [Suiscan](https://suiscan.xyz/testnet/tx/8wDTPzWhoq9YKVT95nVKJnBjqmMkPF1UNKCxvgiZmUif) |
| Our `PredictManager` (shared object) `0xbee649118662e9081042de04bb4796d224768ae8d5ef51e39c8daa7e0d575bd1` | [Suiscan](https://suiscan.xyz/testnet/object/0xbee649118662e9081042de04bb4796d224768ae8d5ef51e39c8daa7e0d575bd1) |
| DeepBook Predict package (integrated) `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` | [Suiscan](https://suiscan.xyz/testnet/object/0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138) |

![One click mints the position on testnet — signed in-process, with a Suiscan link in the toast](submission/media/03-mint.gif)

## What sets it apart

DeepBook Predict has a few front-ends now — a Telegram betting game, an AI chat
assistant, a payoff-curve builder. Tidecast is the one built for whoever actually
prices the trade:

- **The volatility surface, drawn.** A live SVI vol smile and a per-strike
  positioning heatmap, sharing one strike axis with the ladder — hover a strike
  and the smile marker, the heat bar and the ticket all track it. The surface *is*
  the product, not a number buried behind a quote.
- **A native desk, not a web page.** Tauri desktop with in-process signing — no
  wallet popup, no browser chrome. The density and latency of a real trading
  terminal, not a dapp tab.
- **Real and checkable.** Gas-free `devInspect` quotes and a real testnet mint you
  can open on Suiscan (digest above) — no mock counterparty, no placeholder charts.

![The live SVI volatility smile — strike × implied vol, plotted over the full surface with the ATM trough and your strike marked on it](submission/media/04-smile.gif)

## Getting started

```bash
bun install
bun dev          # browser preview at http://localhost:5174
bun tauri dev    # the desktop window
```

To trade you need, in the in-app wallet:

- **Testnet SUI** for gas — the official faucet, guided from onboarding
- **dUSDC** (the quote asset) — there is **no public mint**; request it via the official DeepBook Predict form

All reads and live quotes work without dUSDC.

## Tech stack

| Layer | Choice |
|---|---|
| Desktop shell | Tauri 2.0 |
| Frontend | Vite 6 + React 19, TypeScript strict |
| UI | HeroUI v3 + Tailwind CSS v4 |
| Motion | `motion` (framer-motion) |
| Charts | hand-rolled SVG (smile, ladder, heatmap) |
| Sui | `@mysten/sui` — devInspect quotes, PTB writes, in-process Ed25519 signing |
| State | Zustand + TanStack React Query v5 |
| Package manager | bun |

## Roadmap

- **Range positions** — `mint_range` / `redeem_range` over `RangeKey` (lower/upper band)
- **PLP vault** — LP view: supply dUSDC, track vault performance
- **Copy-trading** — follow a manager's mints via the public positions feed
