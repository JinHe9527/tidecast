# Tidecast demo video

Official 3-part hackathon structure (≤5 min), built as a
[HyperFrames](https://github.com/heygen-com/hyperframes) HTML composition
(`index.html`) over real app screenshots captured from the live testnet app.
Output: 1920×1080, 30 fps, ~3:55.

Structure:

- **Problem** (0:00–0:35) — DeepBook Predict launched with no interface.
- **Meet Tidecast** (0:35–0:45) — title card.
- **Demo** (0:45–3:25) — seven screenshot beats with captions + Ken Burns:
  overview → live devInspect quote → one-click mint (in-process signing) →
  positions with est. PnL (real testnet tx digest shown) → SVI volatility
  smile → market positioning heatmap → onboarding.
- **Vision** (3:25–3:55) — range positions, PLP vault, copy-trading; outro.

## Re-render

Requires Node 22+ and FFmpeg (no install step — the CLI runs via `npx`):

```bash
cd video
bun run render
# = npx hyperframes@0.6.90 render . --quality high --fps 30 --output out/tidecast-demo.mp4
```

Preview/scrub in the browser: `bun run dev`. Checks: `bun run check`
(lint + validate + WCAG contrast + visual inspect).

## Refresh screenshots after a UI change

The capture script lives in the sibling WalDrive repo so playwright resolves
from its `node_modules` (this repo doesn't carry the dependency):

```bash
# 1. start the app (repo root)
bun dev                      # http://localhost:5174

# 2. capture (other terminal) — writes video/public/*.png + boxes.json
cd ../WalDrive/video
node scripts/capture-tidecast.mjs
```

Captures (1280×800 @2x, dark theme, env-seeded wallet): `app-overview`,
`quote-live` (amount 25, settled quote, Mint enabled), `smile`, `positions`,
`heatmap` (auto-picks an expiry that has real market mints), `onboarding`
(temporarily empties `tidecast-wallets` in localStorage, then restores it).
`boxes.json` records the ticket/mint-button bounding boxes the composition
uses for its zoom origins and the highlight ring — if the ticket layout
changes, update the `transform-origin` values and `.mint-ring` position in
`index.html` from the new boxes.
