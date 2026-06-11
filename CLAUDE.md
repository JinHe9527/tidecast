# Tidecast

A desktop trading console for **DeepBook Predict** — Sui's on-chain BTC prediction market (binary & range options priced by an SVI volatility surface). Built for the **Sui Overflow 2026 DeepBook track**.

One-line pitch: *the first actually-usable trading desk for DeepBook Predict — watch the live BTC vol surface, see the market's positioning, and mint/redeem a position in two clicks, signed in-process.*

---

## ⚠️ Identity rules (NON-NEGOTIABLE)

- **This project belongs to GitHub user `JinHe9527`** — repo, commits, pushes, hackathon registration, PRs. **Never** use `Fldicoahkiin` / Flacier for anything in this repo.
- This repo's local git config is already set: `user.name JinHe9527`, `user.email 44663626+JinHe9527@users.noreply.github.com`. Do not change it.
- `git push` works with the macOS keychain default credential (it IS JinHe9527).
- When `gh` is needed: `gh auth switch -u JinHe9527` → do the work → **immediately `gh auth switch -u Fldicoahkiin`** (other projects depend on it).
- WalDrive (`../WalDrive`) is the sibling Walrus-track project owned by Flacier — never cross-commit, never reuse its remote.

## Hackathon context

- **Track**: DeepBook — official theme "DeepBook 链上预测市场" (DeepBook Predict). Prize $35K/$15K/$7.5K/$5K.
- **Deadline**: build phase ends ~2026-06-21 (verify). Demo video required (≤5 min: 30-60s problem / ~3min demo / 30-60s vision). Public repo + testnet Package ID + 1:1 logo at submission.
- **Judge signal**: field is weak (3 real DeepBook-track entries: one fabricated, one half-built stub, the only real one competes in another track). Judges explicitly test the END-TO-END flow. 2026 theme = practical / actually usable. **A polished, genuinely usable trade loop is the win condition.**
- Registration: CN repo `hoh-zone/Overflow2026-CNNo1` — add `project2.md` under `submissions/Fldicoahkiin/`? **NO — register under the JinHe9527 GitHub account** (fork under JinHe9527, own submissions dir). Official entry at overflow.sui.io.

## Verified on-chain facts (testnet, all confirmed by execution 2026-06-11)

| What | Value |
|---|---|
| Predict package | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| Predict (shared) | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| Registry | `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64` |
| Quote coin | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` (6 decimals, **no public mint** — request via form / community) |
| REST server | `https://predict-server.testnet.mystenlabs.com` (public, no auth) |
| Our PredictManager | `0xbee649118662e9081042de04bb4796d224768ae8d5ef51e39c8daa7e0d575bd1` (**shared object**, created by us, digest `2SswsNbJECusaPEBEf7okfwXejfa4HQCVXxBYp7h91yp`) |
| Test wallet | `0xce98556a6a7f924b32d8f4c03ac74d60c34447cff47856402f5bbcf97393a14f` (keypair backup: `~/.waldrive-backup-20260610/env.local.bak`; dUSDC will arrive here) |

### Verified write-path (exact signatures from on-chain bytecode)

```
predict::create_manager(ctx) -> ID                     # PredictManager is SHARED
predict_manager::deposit<DUSDC>(mgr, Coin<DUSDC>, ctx)
predict_manager::balance<DUSDC>(&mgr) -> u64
predict_manager::withdraw<DUSDC>(mgr, u64, ctx) -> Coin<DUSDC>
market_key::up(oracle_id: ID, expiry: u64, strike: u64) -> MarketKey    # pure, build in-PTB
market_key::down(oracle_id, expiry, strike) -> MarketKey
range_key::new(oracle_id, expiry, lower, higher) -> RangeKey
predict::get_trade_amounts(predict, oracle, MarketKey, u64, clock) -> (u64, u64)   # devInspect = FREE live quote
predict::mint<DUSDC>(predict, mgr, oracle, MarketKey, amount_u64, clock, ctx)
predict::redeem<DUSDC>(predict, mgr, oracle, MarketKey, amount_u64, clock, ctx)
predict::redeem_permissionless<DUSDC>(...)
predict::mint_range<DUSDC> / redeem_range<DUSDC>(... RangeKey ...)
predict::supply<DUSDC>(predict, Coin<DUSDC>, clock, ctx) -> Coin<PLP>   # LP vault
predict::withdraw<DUSDC>(predict, Coin<PLP>, clock, ctx) -> Coin<DUSDC>
```

- Verified quote: BTC spot 62575368041947 (13-dec, ~$62,575); 10 dUSDC UP @ ATM strike → `(5022519, 4822543)` ≈ 0.50/0.48 — SVI pricing is live and sane.
- Strike grid: `min_strike` 50000000000000, `tick_size` 1000000000 (from `/predicts/:id/oracles`).
- Oracles roll sub-hourly; each `OracleSVI` has expiry/active/settlement_price; status via `oracle::status(oracle, clock)`.

### REST endpoints (read-only, render-ready)

```
/predicts/:id/oracles            # rolling BTC oracles: oracle_id, expiry, min_strike, tick, status
/predicts/:id/quote-assets       # ["e950…::dusdc::DUSDC"]
/oracles/:id/svi/latest | /svi   # SVI stream: a, b, rho(+neg flag), m(+neg), sigma, timestamp
/oracles/:id/prices/latest | /prices   # spot/forward stream
/trades/:oracle_id
/managers | /managers/:id/summary | /managers/:id/positions/summary | /managers/:id/pnl?range=ALL
/positions/minted | /positions/redeemed | /ranges/minted | /ranges/redeemed
/predicts/:id/vault/summary | /vault/performance?range=ALL | /lp/supplies | /lp/withdrawals
```

## Tech stack (port the WalDrive pattern — it is proven)

| Layer | Choice |
|---|---|
| Shell | Tauri 2.0 (transparent overlay window, traffic-light inset via decorum) |
| Frontend | Vite 6 + React 19, TypeScript strict, single window |
| UI | HeroUI **v3** (compound components, `onPress`, no Provider) + Tailwind **v4** (CSS-first `@theme`) |
| Motion | `motion` (framer-motion) |
| Charts | lightweight SVG/canvas first; consider visx/d3 for the smile curve |
| Sui | `@mysten/sui` — local Ed25519 keypair signs in-process (no extension); devInspect for quotes |
| State | Zustand (wallet, settings) + React Query v5 (REST + chain reads) |
| Package manager | **bun only** |
| Video | hyperframes (skills installed in `.agents/skills/`) |

Code style, HeroUI v3 rules, banned words, simplicity rules: same as WalDrive's CLAUDE.md (functional components, named exports, no `any`, components <150 lines, no inline styles, conventional commits, never push unless asked — except this repo's pushes go as JinHe9527).

## Product (MVP cut)

**Core loop (the demo):** open app → live BTC price + expiry picker (rolling hourly) → strike ladder around spot → pick UP/DOWN → **live quote** (devInspect `get_trade_amounts`, updates as you type) → one-click mint (PTB: deposit if needed → mint; in-process signing) → positions panel with live PnL → on expiry, one-click redeem.

**Supporting surfaces:**
- **Vol smile** — live SVI params → IV curve per expiry (the visual signature; update as `/svi/latest` ticks)
- **Market heatmap** — strike × expiry positioning from `/positions/minted` (where is everyone betting)
- Wallet panel (generate/import, SUI faucet for gas, dUSDC balance), settings, dark/light.

**Roadmap (post-MVP, keep listed):** range positions (mint_range), PLP vault LP view, trader PnL lookup, whale feed, copy-trade.

## Plan (9 days from 2026-06-11)

- D0 ✅ verification (manager created, quote works) + repo + this file
- D1-2: scaffold (Tauri+Vite+HeroUI port) + data layer (REST hooks + oracle reads) + main screen: price, expiries, strike ladder, live quote
- D3-4: trade loop: dUSDC deposit → mint UP/DOWN → positions + live PnL → redeem
- D5: vol smile viz + heatmap
- D6: polish (motion, empty states, onboarding incl. gas/faucet guidance — reuse WalDrive's FaucetBanner lesson)
- D7: demo video (hyperframes; official 3-part structure)
- D8: README, logo, registration (as JinHe9527), submission
- D9: buffer

## Commands

```bash
bun install
bun dev          # Vite dev server (browser preview :5173 — check port clash with WalDrive!)
bun tauri dev    # desktop window
bun build        # production build
bunx tsc --noEmit
```

> Port note: WalDrive also uses :5173. If both run, set Vite port 5174 here (`vite.config.ts` + tauri.conf devUrl).

## Notes

- dUSDC has **no public mint**. Demo needs real dUSDC in the test wallet (requested from community / official form). Quotes (devInspect) and all reads work WITHOUT dUSDC — build read-only surfaces first.
- PredictManager is shared: anyone can pass it to entry calls, contract checks owner internally; `redeem_permissionless` allows third-party settlement.
- Strike/price values are 13-decimal fixed-point on the oracle side (62575368041947 = $62,575.37); dUSDC amounts are 6-decimal.
- `mint` aborts if oracle expired/inactive — always check `oracle::status` / server `status` before quoting.
- No own Move package is strictly required (pure integration). If submission demands a Package ID, consider a thin helper module later — do not build speculatively.
