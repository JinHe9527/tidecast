# DeepBook track — judge-perspective scorecard

Every project below was **cloned and actually run** (install → build → dev/test,
plus live-chain checks), then scored 1–10 across the dimensions a judge using an
automated runner cares about. "Runnability" weighs most: can a fresh clone be
brought up with no hand-holding?

Field scan + per-project deep-dive, 2026-06-22.

## Rubric

| Dim | Means |
|---|---|
| **Runnability** | Cold clone → install → build → run, with minimal/zero config. The hard gate. |
| Code quality | Structure, types, tests, real vs. mock |
| On-chain realness | Real testnet txs / devInspect, not cached fakes |
| DeepBook Predict integration | Depth of use of the Predict protocol |
| Demo & polish | Live site, video, UX |
| Docs | Can an AI reviewer run it from the README alone? |

## Scores

| Project | Run | Code | On-chain | Integration | Demo | Docs | **Overall** |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Tidecast** (ours) | 10 | 8 | 9 | 9 | 9 | 9 | **~9** |
| CallIt | 10 | 9 | 9 | 10 | 8 | 9 | 9 |
| strike5 | 10 | 8 | 9 | 9 | 8 | 9 | 9 |
| DeepPilot | 9 | 9 | 9 | 9 | 8 | 10 | 9 |
| PredictGuard | 10 | 7 | 8 | 9 | 7 | 9 | 8.5 |
| VolShape Studio | 9 | 8 | 7 | 9 | 8 | 9 | 8.3 |
| DeepVol | 8 | 8 | 9 | 9 | 7 | 8 | 8 |
| LadderVault | 9 | 8 | 8 | 4 | 7 | 7 | 7 |
| predict-keeper | 7 | 4 | 7 | 5 | 2 | 2 | 5 |

## The field, in one line each

- **CallIt** — zero-config consumer betting game (Web PWA + Telegram); deepest protocol coverage; no own Move contract.
- **strike5** — gamified arena, cold-clone runs, 22 ADRs; no automated tests.
- **DeepPilot** — AI NL trade assistant with its own Move package + best docs; end-to-end trade hard to auto-verify.
- **PredictGuard** — PLP risk/hedge workflow, byte-level MarketKey decode; risk inputs are synthetic; one 2.6k-line file.
- **VolShape** — payoff-curve → strategy compiler, ~130 tests; no own contract; can't verify its own tx on-chain.
- **DeepVol** — structured "BTC MOVE" vol products, own published package; Move pkgs don't compile from a clean clone.
- **LadderVault** — risk-managed LP vault; honest, but the counterparty is a self-written `predict_mock` (zero real Predict calls).
- **predict-keeper** — settlement keeper bot that does run; but no demo/video/site, README is the bun-init template.

## Where Tidecast stands

Top tier, alongside CallIt / strike5 / DeepPilot. The whole top of this board is
"cold-clone runnable + real chain"; that's table stakes now, and Tidecast clears it
(verified below). The separation comes from **what only Tidecast has**:

1. **The implied-volatility surface, drawn.** Every same-protocol rival *consumes*
   the SVI quote; none renders the strike × IV smile. DeepVol names itself after
   volatility and still doesn't draw it; PredictGuard's heatmap is exposure, not IV.
   This is Tidecast's moat and the hardest thing on the board to copy.
2. **Desktop-native + one-click wallet.** Tauri terminal with an in-process keypair —
   a reviewer clicks *Generate a wallet* and is in. Every rival needs a browser
   extension wallet connected (and most need funds) before anything moves.
3. **Tests + a live smoke.** A vitest unit suite *and* `bun run smoke`, a read-only
   one-command proof the integration is live (strike5 has no tests; most have no
   single-command live check).

Honest weaknesses, same lens: **no Move package of our own** (a pure integration —
shared with CallIt / strike5 / VolShape, acceptable for this track) and the field is
crowded with equally-runnable entries, so the win has to come from the surface + the
desktop polish, not from "we also integrated Predict".

## Tidecast runnability — verified

Cold clone of `JinHe9527/tidecast`, nothing pre-installed, no `.env`:

```
git clone … && cd tidecast
bun install     # 2.5s, 250 packages, no native build
bun run typecheck   # clean
bun run build       # 3s → dist/
bun run dev         # /app renders onboarding, 0 console errors
bun run smoke       # ✅ PASS — live oracle + BTC spot + real devInspect quote
```

Zero environment variables required (constants baked in for testnet). `bun run smoke`
hits the live Predict server and runs the same on-chain `get_trade_amounts` quote the
app uses — the one-command "it's real and it runs" check for an AI reviewer.
