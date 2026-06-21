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

Top tier on the thing that gates everything — **runnability**: cold-clone `bun install
&& bun dev` to a rendered terminal with zero env, plus `bun run smoke` for a one-command
live proof. That's table stakes among the leaders and we clear it cleanly.

**Honest correction — this pass overturned our earlier claim.** Tidecast is *not* the
only one, nor the best, at drawing the volatility surface. A cluster renders a true 3D
SVI surface (built + verified this pass), and on pure vol-visualization some exceed our
2D smile:

- **Predict Quant Suite** — 3D SVI surface (three.js) + smile + vol cone + term structure
  + no-arb checks. Vol-viz is a **superset** of ours.
- **RangeBook** — rotatable 3D SVI mesh + smile + mispricing heatmap + multi-leg strategy
  mint + Breeden–Litzenberger density (11 math tests).
- **Skew / deepskew / VWATCH** — 3D strike×IV surfaces with no-arb checks; Skew & deepskew
  add on-chain trading + their own deployed Move contracts.
- (Vortex labels a 2D CSS-bar smile "vol surface"; most others render only a scalar/bar.)

**What is still genuinely ours, and defensible:**

1. **The only desktop-native terminal.** Every surface-drawer above is a web app with a
   wallet-extension popup. Tidecast is a Tauri desktop terminal signing in-process — no
   popup, no browser chrome. That's a form-factor edge they can't match without rebuilding.
2. **The surface that actually shows up.** Ours is default-on, cold-clone-visible, no
   backend. RangeBook's 3D surface is `VITE_VOL_SURFACE_ENABLED=false` by default (a
   cold-cloning reviewer won't see it) and its multi-expiry mesh is interpolated from one
   SVI print; PQS's surface depends on the team's own hosted backend staying up. For an AI
   reviewer running it in 30 seconds, ours is the most reliable to actually see.
3. **One-command verification.** `bun run smoke` (live) + a vitest suite.

**Honest weaknesses:** no Move package of our own (pure integration — shared with many);
a 2D smile, not 3D; and the surface is no longer a moat. The win now has to come from the
desktop form-factor, demo reliability, and execution polish — not from "we draw the surface".

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
