# Tidecast — demo narration

Voiceover: Kokoro-82M (`af_nova`, warm/professional), 24 kHz mono, speed 1.0.
Three segments, one WAV each, concatenated under the matching scene group.

Structure follows the Sui Overflow demo template: problem (~35s) · demo (~3min) · vision (~35s).

---

## Part 1 — Problem (~35s) · over the title card

> DeepBook Predict just launched. On-chain Bitcoin options, priced by a live
> volatility surface, settled on Sui. The pricing is real, and it's already on
> testnet. But there's no way to actually trade it. No desk. No interface. Just
> raw RPC calls and a REST endpoint. So we built one.

---

## Part 2 — Demo (~3min) · over the recorded interaction clips

### 2a — Market (over 01-market)

> This is Tidecast. The live Bitcoin price streams in the header. Down the left,
> the rolling hourly expiries. On the right, the strike ladder — every strike
> around spot, with the market's estimated win probability on each side. Hover a
> strike, and watch: the marker on the volatility smile and the positioning bar
> below both track the same strike. The ladder, the smile, and the order ticket
> are one linked instrument.

### 2b — Quote (over 02-quote)

> Pick a side and the ticket prices it instantly. This quote is a real
> dev-inspect call against the contract — the same volatility surface DeepBook
> Predict settles on. Change the size, and the cost, the payout, and the implied
> probability roll live. Flip from Up to Down, and it re-prices in place. No
> signing, no gas — just the live quote.

### 2c — Mint (over 03-mint)

> Now we take the position for real. Nearest expiry, at-the-money, Up, two dUSDC.
> One click. The app builds the transaction — deposit and mint in a single
> programmable block — and signs it in-process with a local key. No wallet popup,
> no extension. A few seconds later it settles on testnet, and the position drops
> into the dock below with live profit and loss. That digest is a real Sui
> transaction — you can open it on Suiscan right now.

### 2d — Analytics (over 04-analytics)

> And this is the edge. The volatility smile is the live SVI fit for this expiry —
> the gradient, the at-the-money line, your selected strike, and the skew label
> telling you which tail the market is paying up for. Beneath it, the positioning
> map: net minted contracts at every strike, so you can see where everyone else
> is leaning before you take your side.

---

## Part 3 — Vision (~35s) · over the outro card

> Tidecast — the trading desk for DeepBook Predict. Real quotes, real mints,
> signed in-process, on a surface a trader actually wants to use. Next: range
> positions, the protocol liquidity vault, and copy-trading off the positioning
> map. Built for Sui Overflow 2026, on the DeepBook track.
