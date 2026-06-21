# Tidecast — submission playbook (Sui Overflow 2026, DeepBook track)

Two places to submit, plus one video upload. Ready-to-paste copy below.

## 0. Status / 状态

| Item | State |
|---|---|
| Code on GitHub (`JinHe9527/tidecast`) | ✅ pushed, README sharpened |
| Real testnet proof (mint digest) | ✅ in README + below |
| 1:1 logo | ✅ `icons/logo-1024.png` |
| Demo video file | ✅ `video/out/tidecast-demo.mp4` (1080p, ~3:31) — **needs hosting (step 1)** |
| DeepSurge official submission | ⏳ **you** (step 2, login-gated) |
| hoh-zone PR #15 | ⏳ update after links exist (step 3) |

## 1. Host the demo video (you — 2 min)

DeepSurge and hoh-zone both want a video **link**. Upload the mp4 to YouTube:

1. studio.youtube.com → Create → Upload `video/out/tidecast-demo.mp4`.
2. Visibility **Unlisted** (or Public). Title: `Tidecast — the trading desk for DeepBook Predict (Sui Overflow 2026)`.
3. Copy the watch URL → you'll paste it in steps 2 and 3.

## 2. DeepSurge official submission (you — login-gated)

Portal: https://www.deepsurge.xyz/hackathons/b587dc0c-4cb8-4e63-ada5-519df38103bf
Sign in with the **JinHe9527** identity, pick the **DeepBook** track, paste:

**Project name**
```
Tidecast
```

**Tagline (one line)**
```
The desktop trading terminal for DeepBook Predict — live volatility surface, gas-free quotes, one-click on-chain mint/redeem.
```

**Short description**
```
Tidecast is a desktop-native trading desk for DeepBook Predict, Sui's on-chain BTC prediction market. It renders the live SVI volatility smile and a per-strike positioning heatmap, prices every strike with gas-free devInspect quotes, and mints or redeems a position in one click — signed in-process by a local keypair, no wallet extension. Verified on testnet.
```

**Full description**
```
DeepBook Predict launched on-chain BTC options priced by a live volatility surface, settled on Sui — but there was no way to actually trade it: just raw RPC and a REST endpoint. Tidecast is the desk.

Most front-ends that have appeared on Predict are web or Telegram apps that wrap it as a bet button, a chat assistant, or a payoff-curve builder. Tidecast is built for whoever prices the trade:

• The volatility surface, drawn — a live SVI vol smile and a per-strike positioning heatmap, sharing one strike axis with the ladder. Hover a strike and the smile marker, the heat bar and the order ticket all track it. The surface is the product, not a number hidden behind a quote.
• A native desk, not a web page — Tauri desktop, in-process Ed25519 signing, no wallet popup, no browser chrome. The density and latency of a real trading terminal.
• Real and checkable — gas-free devInspect quotes (priced against the same SVI surface Predict settles on) and a real testnet mint you can open on Suiscan. No mock counterparty, no placeholder charts.

The trade loop: pick a rolling hourly expiry → strike ladder around spot with each side's implied win probability → live quote that re-prices as you type → one click builds and signs the PTB (deposit + mint) in-process → the position drops into the dock with live PnL → one-click redeem on expiry.

Tidecast ships no Move package of its own — it is a pure integration: the on-chain logic is DeepBook Predict, called through its public entry functions.

Built with Tauri 2.0 + Vite/React 19 + HeroUI v3, @mysten/sui for devInspect quotes and PTB writes.
```

**Track**: DeepBook
**GitHub**: https://github.com/JinHe9527/tidecast
**Demo video**: «YouTube URL from step 1»
**Website / live demo**: desktop app — see GitHub Releases / build from source (no hosted web app by design)
**Logo**: upload `icons/logo-1024.png`

**Proof (paste if there's a notes field)**
```
Real testnet mint: 8wDTPzWhoq9YKVT95nVKJnBjqmMkPF1UNKCxvgiZmUif
  → https://suiscan.xyz/testnet/tx/8wDTPzWhoq9YKVT95nVKJnBjqmMkPF1UNKCxvgiZmUif
DeepBook Predict package (integrated): 0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138
Our PredictManager (shared): 0xbee649118662e9081042de04bb4796d224768ae8d5ef51e39c8daa7e0d575bd1
```

**Team**: JinHe9527 (solo)

## 3. hoh-zone PR #15 (I'll do this once you have the YouTube URL)

PR: https://github.com/hoh-zone/Overflow2026-CNNo1/pull/15
I'll refresh `submissions/jinhe9527/README.md` with the sharpened description, the
DeepSurge project URL, and the YouTube link — committed as JinHe9527.
