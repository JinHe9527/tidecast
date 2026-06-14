# Tidecast demo video

Real-interaction demo, 3-part hackathon structure (≤5 min). The demo footage is
**recorded from the live app on testnet** — a Playwright-driven browser drives the
terminal with a synthetic cursor and records each scene; one scene performs a real
mint (a signed PTB on testnet) and captures the tx digest. Narration is generated
with Kokoro TTS. Everything is composed with FFmpeg.

Output: `out/tidecast-demo.mp4` — 1920×1080, 30 fps, ~3:31, H.264 + AAC.

Structure:

- **Problem** (~0:38) — title card + "no way to actually trade DeepBook Predict".
- **Demo** (~2:38) — the four recorded scenes, narrated, with lower-third captions:
  - `01-market` — terminal loads, live ticker; hover the expiry rail + strike
    ladder so the smile marker and heat bar track the cursor (the cross-link).
  - `02-quote` — load the ticket, step amount presets, toggle Up/Down; the cost /
    payout / implied probability roll live (devInspect, no signing).
  - `03-mint` — ATM Up, 1 dUSDC, **real Mint** → PTB signs in-process → success
    toast with a Suiscan link → the position lands in the dock with live PnL. The
    caption shows `real testnet mint` + the captured tx digest.
  - `04-analytics` — sweep the live SVI vol smile (gradient, ATM / your-strike
    markers, skew label) and the positioning heatmap beneath.
- **Vision** (~0:35) — range positions, PLP vault, copy-trading; outro card with
  `github.com/JinHe9527/tidecast`.

Branding uses the app's tide-line icon (`../icons/icon.svg`) on the title and
outro cards, with the DESIGN palette (cyan `#22d3ee` over deep `#070e18`).

## Pipeline

Self-contained — uses this folder's own `node_modules` (Playwright + Chromium).
Kokoro TTS needs a Python venv with `kokoro-onnx` + `soundfile` (see below).

```bash
# 0. start the app (repo root) — the env-seeded funded wallet is active on load
bun dev                                  # http://localhost:5174

# 1. record the four scenes → out/clips/*.webm  (+ out/clips/mint-digest.txt)
cd video
node scripts/record.mjs                  # all scenes; or `node scripts/record.mjs 03-mint`

# 2. narration → out/audio/*.wav  (Kokoro-82M, voice af_nova)
#    the six segment texts live in scripts/narration/ (see script.md for the prose)
python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
mkdir -p out/audio
for f in scripts/narration/*.txt; do
  PATH=".venv/bin:$PATH" npx hyperframes tts "$f" --voice af_nova \
    --output "out/audio/$(basename "$f" .txt).wav"
done

# 3. render the branded cards + lower-third captions → out/cards, out/captions
node scripts/render-cards.mjs
node scripts/render-captions.mjs         # embeds the digest from out/clips/mint-digest.txt

# 4. compose everything → out/tidecast-demo.mp4
bash scripts/compose.sh
```

Requirements: Node 22+, FFmpeg, and (for step 2) Python 3.8+. Chromium is bundled
under `node_modules` via Playwright.

## Notes

- **Real mint, real gas.** Scene `03-mint` spends ~0.5 dUSDC from the wallet's
  pre-deposited PredictManager headroom and a little SUI for gas. 1 dUSDC keeps
  the position inside the deposited headroom so the PTB is mint-only (no deposit
  step) and stays cheap. Top up SUI at faucet.sui.io if gas runs low.
- The recorder injects a synthetic cyan cursor (`#__cursor`) so the camera sees
  the pointer; it follows mousemove and shrinks on mousedown.
- `recordVideo.size` must equal the viewport (1920×1080) — Playwright pads, not
  scales, a larger canvas. `deviceScaleFactor: 2` keeps the 1080p output crisp.
- Captions and cards are rendered to PNG via Playwright from `captions.html` /
  `cards.html`, then overlaid/animated in FFmpeg.
- Everything under `out/` (clips, audio, cards, captions, the final mp4) is
  gitignored; only the scripts, HTML, `script.md`, and this README are tracked.
- Old static-screenshot HyperFrames assets (`index.html`, `public/*.png`,
  `meta.json`) are kept for reference but no longer drive the render.
