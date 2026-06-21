# DeepBook track — competitive landscape (Tidecast)

Field scan of the Sui Overflow 2026 DeepBook track, 2026-06-21. Every entry below
was read from source (GitHub repos, live sites, on-chain state on Sui testnet), not
from the pitch text. The point: locate Tidecast's defensible ground in the final hours.

## TL;DR

The DeepBook track splits into **DeepBook Predict** (the on-chain BTC options/
prediction market, package `0xf5ea2b37…5138`) and broader DeepBook spot/orderbook
tooling. Of the projects that actually build *on DeepBook Predict*, almost all are
**web or Telegram apps**. One makes volatility a *product name* (DeepVol), another
uses vol as a single stress-test *scalar* (PredictGuard) — but **not one of them
draws the strike × implied-volatility surface**: the smile, the skew, the term
structure. That is Tidecast's moat, and it survives even the name collisions.

**Tidecast's three defensible edges, confirmed against every same-protocol rival:**

1. **The volatility surface, visualized.** Live SVI vol smile + per-strike
   positioning heatmap, on a strike × IV axis. Every same-protocol competitor
   *consumes* the SVI quote; none *draws* the surface. (DeepVol's "VolatilityChart"
   is a hardcoded time × price band; PredictGuard's heatmap is strike × expiry
   *exposure*, not IV.) This is the hardest thing to copy in the time left.
2. **Desktop-native terminal.** Tauri, in-process signing, no wallet popup, no
   browser chrome. Every Predict rival is a web/Telegram app.
3. **Real integration, verifiable.** A real testnet mint
   (`8wDTPzWhoq9YKVT95nVKJnBjqmMkPF1UNKCxvgiZmUif`) and gas-free `devInspect`
   quotes — where several rivals lean on mock counterparties or mock chart data.

## Same-protocol rivals (build on DeepBook Predict)

| Project | Form | Real? | Has vol surface? | Threat |
|---|---|---|---|---|
| **strike5** (PR #35) | Web gamified arena (streak/leaderboard) | Yes (5/5, ~70 commits, live) | No | **High** |
| **DeepPilot** (PR #20) | AI NL trade assistant + Telegram + Walrus/Seal + subscription | Yes (4.5/5) | No | **Med-high** |
| **DeepVol** (PR #40) | Structured "BTC MOVE" volatility products (UP/DOWN/RANGE), web | Yes (5/5, deployed, 60+ test docs) | No — "VolatilityChart" is a hardcoded time × price band | Med |
| **VolShape Studio** (PR #32) | Payoff-curve → strategy compiler + AI copilot (web) | Yes (4.5/5) | No ("VolShape" = payoff shape, not vol surface) | Med |
| **CallIt** (PR #25) | Telegram/PWA up-or-down betting game, social virality | Yes (4.5/5) | No | Med |
| **PredictGuard** (PR #33) | PLP/LP tail-risk + hedge workflow (web) | Yes (5/5, real demo tx) | No — heatmap is strike × expiry exposure | Low-med (complementary) |
| **LadderVault** (PR #39) | Risk-managed LP vault (web) | Partial — counterparty is `predict_mock`; NAV/pin charts are mock data | No | Low (complementary) |
| **predict-keeper** (PR #10) | Off-chain settlement keeper bot | Yes (4/5) but no video / no site / debug-only UI | No | Low (different lane) |

### strike5 — the closest competitor
Same protocol, same mint→redeem loop, same gas-free simulate-quote trick, live on
Vercel, with a full pitch suite (22 ADRs, a deck, a video runbook). It out-packages
us. But it is a **web game** (streak combos, leaderboard, arena feed) with **no vol
smile, no strike ladder pricing view, no heatmap** — it reads the vol quote but
never shows the pricing structure. Our counter: lead with the surface and the
native terminal, the two things it structurally cannot show.

### DeepPilot — the best narrative
"Ask → draft → review → sign → track" NL trading + a risk Guardian + Telegram +
Walrus memory + an on-chain subscription business. The story aligns neatly with the
official "AI agents on Sui" framing, so judges may lean toward it. But it is a
**beginner-onboarding assistant**, not a trader's desk: no SVI smile, no strike
ladder, no heatmap, web-only. Our counter: "professional terminal vs. starter
chatbot" — same SVI data, but we turn it into a tradable pricing view.

### VolShape Studio — the name collision that isn't
The scariest name on the board, and the most reassuring once read: "VolShape" means
**payoff shape**, not volatility surface. It is a draw-your-payoff-curve → compile-
to-strategy tool. Genuinely good and orthogonal — it has the curve compiler we
don't, we have the vol surface it doesn't. Not a head-on collision.

### CallIt — the consumer play
A slick Telegram/PWA "tap up or down" game with Enoki zkLogin, sponsored gas, and
share-card virality. Real on-chain, but a **toy, not a tool** — no pricing depth,
and a heavier centralized server (Vercel + Postgres + keeper). Different audience.

### DeepVol & PredictGuard — the name collisions that aren't
Both are real, deployed, well-engineered — and both *sound* like they own the
volatility ground. Neither does. **DeepVol** wraps Predict's RANGE primitive as a
"BTC MOVE" structured product; its `VolatilityChart` renders a **hardcoded time ×
price band**, not a strike × IV surface (a full-repo search for `svi/smile/surface/
skew` returns zero). **PredictGuard** is an LP tail-risk + hedge workflow; its
heatmap is **strike × expiry exposure**, and "vol" appears only as a scalar stress
multiplier. The lesson for our copy: don't claim "nobody touches volatility" —
claim, precisely, that **nobody draws the implied-volatility surface**. That line
holds even against a judge who has seen DeepVol.

## Adjacent / different lane (not direct competitors)

- **DeepFlow** (PR #34) — strong, real, 132 commits — but registered under **DeFi &
  Payments**, not DeepBook, and it's a liquidity-routing aggregator, not Predict.
- **LadderVault / predict-keeper** — supply-side (LP vault) and infra (settlement
  bot). They *complement* a trading terminal rather than compete with it; together
  they sketch a fuller Predict ecosystem with Tidecast as the taker-side desk.

## Where this leaves Tidecast

In the DeepBook **Predict** sub-field, the realistic head-to-head is **strike5,
DeepPilot, and DeepVol**. They beat us on packaging and on a crowd-pleasing
narrative; they lose to us on **product depth** (the IV surface, the pricing-grade
visualization, the native desk). The final-hours play is therefore **not more
features** — it's making
the depth and the proof impossible to miss: surface-first demo opening, real-tx
proof on the README's first screen, and a "professional terminal, not a web game"
positioning line repeated across README, demo, and the submission.
